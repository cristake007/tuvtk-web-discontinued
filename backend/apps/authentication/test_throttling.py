import json

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings


@override_settings(LOGIN_THROTTLE_LIMIT=2, LOGIN_THROTTLE_WINDOW_SECONDS=60)
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
            REMOTE_ADDR="192.0.2.10",
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
