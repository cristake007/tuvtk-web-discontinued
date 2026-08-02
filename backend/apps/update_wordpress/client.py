from __future__ import annotations

import base64
import json
import random
import socket
import time
from http.client import HTTPConnection, HTTPException, HTTPSConnection
from typing import Any
from urllib.parse import quote, urljoin, urlsplit

from .domain import extract_slug_from_permalink
from .validators import (
    resolve_validated_target,
    validate_http_url_syntax,
    validate_public_http_url,
)

MAX_RESPONSE_BYTES = 5 * 1024 * 1024
MAX_REDIRECTS = 3
REQUEST_TIMEOUT_SECONDS = 30
MIN_REQUEST_INTERVAL_SECONDS = 0.85
MAX_RETRIES = 4
BASE_BACKOFF_SECONDS = 1.25
RETRYABLE_STATUS_CODES = {403, 429, 500, 502, 503, 504}
REDIRECT_STATUS_CODES = {301, 302, 303, 307, 308}


class WordPressRequestError(RuntimeError):
    """A client-safe WordPress integration failure."""


class _PinnedHTTPConnection(HTTPConnection):
    """HTTPConnection that connects to a pre-validated IP, not the hostname.

    Standard HTTPConnection re-resolves ``host`` via getaddrinfo() inside
    connect(), which would undo DNS-pinning done by the SSRF validator.
    """

    def __init__(self, host: str, pinned_ip: str, port: int, *, timeout: float):
        super().__init__(host, port, timeout=timeout)
        self._pinned_ip = pinned_ip

    def connect(self) -> None:
        self.sock = socket.create_connection(
            (self._pinned_ip, self.port), self.timeout, self.source_address
        )


class _PinnedHTTPSConnection(HTTPSConnection):
    """HTTPSConnection that connects to a pre-validated IP, not the hostname.

    TLS server_hostname stays the original hostname so certificate
    verification and SNI are unaffected by the IP pinning.
    """

    def __init__(self, host: str, pinned_ip: str, port: int, *, timeout: float):
        super().__init__(host, port, timeout=timeout)
        self._pinned_ip = pinned_ip

    def connect(self) -> None:
        sock = socket.create_connection(
            (self._pinned_ip, self.port), self.timeout, self.source_address
        )
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


class WPCourseClient:
    def __init__(self, base_url: str, username: str, app_password: str):
        raw_base_url = (base_url or "").strip().rstrip("/")
        self.base_url = validate_http_url_syntax(raw_base_url) if raw_base_url else ""

        clean_username = (username or "").strip()
        clean_password = (app_password or "").strip().replace(" ", "")
        credentials = f"{clean_username}:{clean_password}".encode()
        self._auth_header = "Basic " + base64.b64encode(credentials).decode("ascii")
        self._last_request_ts = 0.0

    def _sleep_for_spacing(self) -> None:
        elapsed = time.monotonic() - self._last_request_ts
        if elapsed < MIN_REQUEST_INTERVAL_SECONDS:
            time.sleep(MIN_REQUEST_INTERVAL_SECONDS - elapsed)

    def _request_once(
        self,
        method: str,
        url: str,
        *,
        use_auth: bool,
        json_body: Any = None,
    ) -> tuple[int, dict[str, str], bytes, str]:
        validated_url, pinned_ip = resolve_validated_target(url)
        parsed = urlsplit(validated_url)
        connection_cls = (
            _PinnedHTTPSConnection if parsed.scheme == "https" else _PinnedHTTPConnection
        )
        port = parsed.port or (443 if parsed.scheme == "https" else 80)

        self._sleep_for_spacing()
        connection = connection_cls(
            parsed.hostname, pinned_ip, port, timeout=REQUEST_TIMEOUT_SECONDS
        )
        try:
            headers = {
                "User-Agent": "TUVTK-Update-WordPress/1.0",
                "Accept": "application/json",
                "Cache-Control": "no-cache",
            }
            body_bytes = b""
            if json_body is not None:
                body_bytes = json.dumps(json_body).encode("utf-8")
                headers["Content-Type"] = "application/json"
            if use_auth:
                headers["Authorization"] = self._auth_header

            path = parsed.path or "/"
            if parsed.query:
                path = f"{path}?{parsed.query}"

            connection.request(method, path, body=body_bytes or None, headers=headers)
            response = connection.getresponse()
            response_headers = {key: value for key, value in response.getheaders()}

            content_length = response_headers.get("Content-Length")
            if content_length and content_length.isdigit():
                if int(content_length) > MAX_RESPONSE_BYTES:
                    raise WordPressRequestError("WordPress a returnat un răspuns prea mare.")

            raw_body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw_body) > MAX_RESPONSE_BYTES:
                raise WordPressRequestError("WordPress a returnat un răspuns prea mare.")

            return response.status, response_headers, raw_body, validated_url
        except (HTTPException, OSError) as exc:
            raise WordPressRequestError("WordPress nu poate fi contactat.") from exc
        finally:
            connection.close()
            self._last_request_ts = time.monotonic()

    @staticmethod
    def _is_cloudflare_challenge(headers: dict[str, str], body: bytes) -> bool:
        mitigated = (headers.get("cf-mitigated") or "").strip().casefold()
        if mitigated == "challenge":
            return True
        return b"just a moment" in body[:4096].casefold()

    @staticmethod
    def _retry_after_seconds(headers: dict[str, str]) -> float | None:
        value = (headers.get("Retry-After") or "").strip()
        if not value:
            return None
        try:
            return max(0.0, float(value))
        except ValueError:
            return None

    def _compute_backoff(self, attempt_index: int, headers: dict[str, str]) -> float:
        retry_after = self._retry_after_seconds(headers)
        if retry_after is not None:
            return retry_after + random.uniform(0.1, 0.4)
        delay = min(BASE_BACKOFF_SECONDS * (2**attempt_index), 12.0)
        return delay + random.uniform(0.1, 0.5)

    def _raise_for_status(self, status: int, headers: dict[str, str], body: bytes) -> None:
        if 200 <= status < 300:
            return
        if self._is_cloudflare_challenge(headers, body):
            raise WordPressRequestError(
                "WordPress a respins cererea printr-un test de securitate al browserului."
            )
        if status == 401:
            raise WordPressRequestError("Autentificarea la WordPress a eșuat.")
        if status == 403:
            raise WordPressRequestError("WordPress a refuzat această operațiune.")
        if status == 404:
            raise WordPressRequestError("Endpointul WordPress necesar nu a fost găsit.")
        if status == 429:
            raise WordPressRequestError("WordPress limitează temporar cererile.")
        if status >= 500:
            raise WordPressRequestError("WordPress este temporar indisponibil.")
        raise WordPressRequestError("WordPress a respins cererea.")

    def _request_with_redirects(
        self,
        method: str,
        url: str,
        *,
        use_auth: bool,
        json_body: Any = None,
    ) -> tuple[int, dict[str, str], bytes]:
        current_method = method
        current_url = url
        current_json = json_body

        for redirect_index in range(MAX_REDIRECTS + 1):
            status, headers, body, validated_url = self._request_once(
                current_method,
                current_url,
                use_auth=use_auth,
                json_body=current_json,
            )
            if status not in REDIRECT_STATUS_CODES:
                return status, headers, body

            location = (headers.get("Location") or "").strip()
            if not location:
                raise WordPressRequestError("WordPress a returnat o redirecționare invalidă.")
            if redirect_index >= MAX_REDIRECTS:
                raise WordPressRequestError("WordPress a returnat prea multe redirecționări.")

            current_url = urljoin(validated_url, location)
            validate_public_http_url(current_url)
            if status == 303 or (status in (301, 302) and current_method == "POST"):
                current_method = "GET"
                current_json = None

        raise WordPressRequestError("WordPress a returnat prea multe redirecționări.")

    def _request_with_retries(
        self,
        method: str,
        path: str,
        *,
        use_auth: bool,
        retry_on_401_without_auth: bool = False,
        json_body: Any = None,
    ) -> tuple[int, dict[str, str], bytes]:
        normalized_path = path if path.startswith("/") else f"/{path}"
        url = f"{self.base_url}{normalized_path}"
        last_result: tuple[int, dict[str, str], bytes] | None = None

        for attempt in range(MAX_RETRIES + 1):
            status, headers, body = self._request_with_redirects(
                method, url, use_auth=use_auth, json_body=json_body
            )
            if 200 <= status < 300:
                return status, headers, body
            last_result = (status, headers, body)

            if status == 401 and retry_on_401_without_auth and use_auth:
                fallback = self._request_with_redirects(
                    method, url, use_auth=False, json_body=json_body
                )
                if 200 <= fallback[0] < 300:
                    return fallback
                last_result = fallback
                status, headers = fallback[0], fallback[1]

            if status in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES:
                time.sleep(self._compute_backoff(attempt, headers))
                continue
            break

        assert last_result is not None
        self._raise_for_status(*last_result)
        raise WordPressRequestError("Nu s-a putut apela endpointul WordPress.")

    @staticmethod
    def _decode_json(body: bytes) -> Any:
        try:
            return json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise WordPressRequestError("WordPress a returnat un răspuns invalid.") from exc

    def get_course_by_slug(self, slug: str) -> dict[str, Any] | None:
        clean_slug = str(slug or "").strip()
        if not clean_slug:
            return None

        _status, _headers, body = self._request_with_retries(
            "GET",
            f"/wp-json/wp/v2/cursuri?slug={quote(clean_slug, safe='')}",
            use_auth=True,
            retry_on_401_without_auth=True,
        )
        data = self._decode_json(body)
        if not isinstance(data, list):
            return None
        for item in data:
            if str((item or {}).get("slug", "")).strip() == clean_slug:
                return item
        return None

    def test_connection(self) -> dict[str, Any]:
        _status, _headers, body = self._request_with_retries(
            "GET",
            "/wp-json/wp/v2/users/me",
            use_auth=True,
        )
        data = self._decode_json(body)
        return data if isinstance(data, dict) else {}

    def resolve_course_post_id(
        self,
        slug: str | None = None,
        permalink: str | None = None,
        fallback_post_id: int | None = None,
    ) -> int | None:
        clean_slug = str(slug or "").strip()
        if not clean_slug and permalink:
            clean_slug = extract_slug_from_permalink(permalink)
        if not clean_slug:
            return None

        course = self.get_course_by_slug(clean_slug)
        if not course or course.get("id") is None:
            return None
        try:
            return int(course["id"])
        except (TypeError, ValueError):
            return None

    def get_course(self, post_id: int) -> dict[str, Any]:
        _status, _headers, body = self._request_with_retries(
            "GET",
            f"/wp-json/wp/v2/cursuri/{int(post_id)}",
            use_auth=True,
            retry_on_401_without_auth=True,
        )
        data = self._decode_json(body)
        if not isinstance(data, dict):
            raise WordPressRequestError("WordPress a returnat un răspuns invalid.")
        return data

    def update_course_program(self, post_id: int, final_program: list[dict[str, str]]) -> dict[str, Any]:
        payload = {"acf": {"program": final_program if final_program else False}}
        _status, _headers, body = self._request_with_retries(
            "POST",
            f"/wp-json/wp/v2/cursuri/{int(post_id)}",
            use_auth=True,
            json_body=payload,
        )
        data = self._decode_json(body)
        if not isinstance(data, dict):
            raise WordPressRequestError("WordPress a returnat un răspuns invalid.")
        return data
