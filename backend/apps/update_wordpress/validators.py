from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urlsplit, urlunsplit

HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}\.?$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*"
    r"[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.?$"
)
BLOCKED_METADATA_HOSTNAMES = {
    "metadata.google.internal",
    "metadata.azure.internal",
    "instance-data.ec2.internal",
}


class InvalidWordPressUrlError(ValueError):
    """A WordPress base URL or redirect target failed safety validation."""


def _is_ip_literal(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _is_prohibited_ip(value: str) -> bool:
    address = ipaddress.ip_address(value.split("%", 1)[0])
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped
    return not address.is_global


def validate_http_url_syntax(value: str, *, label: str = "Adresa WordPress") -> str:
    try:
        parsed = urlsplit(value)
        port = parsed.port
    except ValueError as exc:
        raise InvalidWordPressUrlError(f"{label} este invalidă.") from exc

    if parsed.scheme.lower() not in {"http", "https"}:
        raise InvalidWordPressUrlError(f"{label} trebuie să folosească http sau https.")
    if parsed.username is not None or parsed.password is not None:
        raise InvalidWordPressUrlError(f"{label} nu trebuie să conțină credențiale.")
    if parsed.fragment:
        raise InvalidWordPressUrlError(f"{label} nu trebuie să conțină un fragment.")
    if not parsed.hostname or parsed.query:
        raise InvalidWordPressUrlError(f"{label} este invalidă.")

    host = parsed.hostname.rstrip(".").lower()
    if not host or (not _is_ip_literal(host) and not HOSTNAME_RE.fullmatch(host)):
        raise InvalidWordPressUrlError(f"{label} conține un nume de gazdă invalid.")
    if host == "localhost" or host.endswith(".localhost") or host in BLOCKED_METADATA_HOSTNAMES:
        raise InvalidWordPressUrlError(f"{label} indică o destinație interzisă.")

    default_port = 443 if parsed.scheme.lower() == "https" else 80
    netloc = f"[{host}]" if ":" in host else host
    if port and port != default_port:
        netloc = f"{netloc}:{port}"

    path = parsed.path.rstrip("/")
    return urlunsplit((parsed.scheme.lower(), netloc, path, "", ""))


def validate_public_http_url(value: str) -> str:
    normalized = validate_http_url_syntax(value)
    parsed = urlsplit(normalized)
    host = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    try:
        addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise InvalidWordPressUrlError("Gazda WordPress nu a putut fi rezolvată.") from exc
    if not addresses:
        raise InvalidWordPressUrlError("Gazda WordPress nu a putut fi rezolvată.")

    try:
        prohibited = any(_is_prohibited_ip(item[4][0]) for item in addresses)
    except ValueError as exc:
        raise InvalidWordPressUrlError(
            "Gazda WordPress s-a rezolvat la o adresă invalidă."
        ) from exc
    if prohibited:
        raise InvalidWordPressUrlError("Adresa WordPress indică o destinație interzisă.")

    return normalized
