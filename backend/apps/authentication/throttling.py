import hashlib

from django.conf import settings
from django.core.cache import cache


class LoginFailureThrottle:
    def __init__(self, request, username: str):
        self.limit = settings.LOGIN_THROTTLE_LIMIT
        self.window_seconds = settings.LOGIN_THROTTLE_WINDOW_SECONDS
        normalized_username = username.strip().casefold()
        remote_address = request.META.get("REMOTE_ADDR", "unknown")
        self.username_key = self._cache_key("username", normalized_username)
        self.ip_key = self._cache_key("ip", remote_address)

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
