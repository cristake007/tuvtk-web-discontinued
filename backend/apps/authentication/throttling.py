import hashlib
import ipaddress

from django.conf import settings
from django.core.cache import cache
from redis.exceptions import RedisError


def _client_ip(request) -> str:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    forwarded_ips = [value.strip() for value in forwarded_for.split(",")]
    proxy_depth = settings.LOGIN_THROTTLE_TRUSTED_PROXY_DEPTH
    candidates = []
    if len(forwarded_ips) >= proxy_depth:
        candidates.append(forwarded_ips[-proxy_depth])
    candidates.append(request.META.get("REMOTE_ADDR", "").strip())
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
        try:
            return any(int(cache.get(key, 0)) >= self.limit for key in self._keys)
        except (OSError, RedisError, ValueError):
            return False

    def record_failure(self) -> None:
        try:
            for key in self._keys:
                if cache.add(key, 1, timeout=self.window_seconds):
                    continue
                try:
                    cache.incr(key)
                except ValueError:
                    cache.set(key, 1, timeout=self.window_seconds)
        except (OSError, RedisError):
            return

    def clear_username(self) -> None:
        try:
            cache.delete(self.username_key)
        except (OSError, RedisError):
            return

    @property
    def _keys(self) -> tuple[str, str]:
        return self.username_key, self.ip_key
