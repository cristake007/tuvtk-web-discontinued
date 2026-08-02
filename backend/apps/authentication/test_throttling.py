import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings

TEST_CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "login-throttling-tests",
    }
}


@override_settings(
    CACHES=TEST_CACHES,
    LOGIN_THROTTLE_LIMIT=2,
    LOGIN_THROTTLE_WINDOW_SECONDS=60,
)
class LoginThrottlingTests(TestCase):
    def setUp(self):
        cache.clear()
        get_user_model().objects.create_user(
            username="throttled-user",
            password="correct-password-123",
        )
        self.client = Client(enforce_csrf_checks=True)
        self.client.get("/api/v1/auth/csrf")

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def invalid_login(self):
        return self.client.post(
            "/api/v1/auth/login",
            data=json.dumps(
                {
                    "username": "throttled-user",
                    "password": "incorrect-password",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.client.cookies["csrftoken"].value,
            HTTP_X_FORWARDED_FOR="192.0.2.10",
            REMOTE_ADDR="172.18.0.2",
        )

    def test_repeated_invalid_logins_are_throttled_by_user_and_ip(self):
        self.assertEqual(self.invalid_login().status_code, 401)
        self.assertEqual(self.invalid_login().status_code, 401)

        response = self.invalid_login()

        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.json()["code"], "throttled")
        self.assertEqual(response.json()["fields"], {})

    def test_invalid_credentials_use_standard_error_shape(self):
        response = self.invalid_login()

        self.assertEqual(
            response.json(),
            {
                "code": "invalid_credentials",
                "detail": "Invalid username or password.",
                "fields": {},
            },
        )

    def test_spoofed_forwarded_prefix_does_not_change_client_ip(self):
        first = self.invalid_login()
        second = self.client.post(
            "/api/v1/auth/login",
            data=json.dumps(
                {
                    "username": "another-user",
                    "password": "incorrect-password",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.client.cookies["csrftoken"].value,
            HTTP_X_FORWARDED_FOR="198.51.100.99, 192.0.2.10",
            REMOTE_ADDR="172.18.0.2",
        )
        blocked = self.client.post(
            "/api/v1/auth/login",
            data=json.dumps(
                {
                    "username": "third-user",
                    "password": "incorrect-password",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=self.client.cookies["csrftoken"].value,
            HTTP_X_FORWARDED_FOR="203.0.113.77, 192.0.2.10",
            REMOTE_ADDR="172.18.0.2",
        )

        self.assertEqual(first.status_code, 401)
        self.assertEqual(second.status_code, 401)
        self.assertEqual(blocked.status_code, 429)

    @override_settings(LOGIN_THROTTLE_TRUSTED_PROXY_DEPTH=2)
    def test_external_proxy_uses_second_address_from_right(self):
        from apps.authentication.throttling import _client_ip

        request = self.client.get(
            "/api/v1/auth/csrf",
            HTTP_X_FORWARDED_FOR="192.0.2.10, 198.51.100.5",
            REMOTE_ADDR="172.18.0.2",
        ).wsgi_request

        self.assertEqual(_client_ip(request), "192.0.2.10")

    @override_settings(LOGIN_THROTTLE_TRUSTED_PROXY_DEPTH=2)
    def test_missing_expected_proxy_hops_falls_back_to_remote_address(self):
        from apps.authentication.throttling import _client_ip

        request = self.client.get(
            "/api/v1/auth/csrf",
            HTTP_X_FORWARDED_FOR="192.0.2.10",
            REMOTE_ADDR="172.18.0.2",
        ).wsgi_request

        self.assertEqual(_client_ip(request), "172.18.0.2")
