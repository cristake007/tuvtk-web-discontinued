import hashlib
import ipaddress

from django.conf import settings
from django.core.cache import cache


def _client_ip(request) -> str:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    candidates = [
        forwarded_for.split(",", maxsplit=1)[0].strip(),
        request.META.get("REMOTE_ADDR", "").strip(),
    ]
    for candidate in candidates:
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            continue
    return "unknown"


class LoginFailureThrottle:
    def __init__(self, request, username: str):
        self.limit = settings.LOGIN_THROTTLE_LIMIT
        self.window_seconds = settings.LOGIN_THROTTLE_WINDOW_SECONDS
        normalized_username = username.strip().casefold()
        self.username_key = self._cache_key("username", normalized_username)
        self.ip_key = self._cache_key("ip", _client_ip(request))

    @staticmethod
    def _cache_key(kind: str, value: str) -> str:
        digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
        return f"authentication:login-failures:{kind}:{digest}"

    def is_blocked(self) -> bool:
        return any(int(cache.get(key, 0)) >= self.limit for key in self._keys)

    def record_failure(self) -> None:
        for key in self._keys:
            if cache.add(key, 1, timeout=self.window_seconds):
                continue
            try:
                cache.incr(key)
            except ValueError:
                cache.set(key, 1, timeout=self.window_seconds)

    def clear_username(self) -> None:
        cache.delete(self.username_key)

    @property
    def _keys(self) -> tuple[str, str]:
        return self.username_key, self.ip_key
