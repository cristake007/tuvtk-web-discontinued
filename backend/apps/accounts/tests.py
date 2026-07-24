import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase


class SessionAuthenticationApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="frontend-user",
            email="frontend@example.com",
            password="test-password-123",
        )
        self.client = Client(enforce_csrf_checks=True)

    def csrf_token(self) -> str:
        response = self.client.get("/api/v1/auth/csrf")

        self.assertEqual(response.status_code, 204)
        self.assertIn("csrftoken", self.client.cookies)
        return self.client.cookies["csrftoken"].value

    def login(self, password: str = "test-password-123"):
        token = self.csrf_token()
        return self.client.post(
            "/api/v1/auth/login",
            data=json.dumps(
                {
                    "username": "frontend-user",
                    "password": password,
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )

    def test_session_reports_anonymous_user_without_an_error(self):
        response = self.client.get("/api/v1/auth/session")

        self.assertEqual(response.status_code, 200)
        self.assertIn("no-cache", response.headers["Cache-Control"])
        self.assertIn("no-store", response.headers["Cache-Control"])
        self.assertEqual(
            response.json(),
            {
                "authenticated": False,
                "user": None,
            },
        )

    def test_login_requires_csrf(self):
        response = self.client.post(
            "/api/v1/auth/login",
            data=json.dumps(
                {
                    "username": "frontend-user",
                    "password": "test-password-123",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_login_rejects_invalid_credentials(self):
        response = self.login(password="incorrect-password")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(),
            {"detail": "Invalid username or password."},
        )

    def test_login_creates_a_session(self):
        response = self.login()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])
        self.assertEqual(response.json()["user"]["username"], "frontend-user")

        session_response = self.client.get("/api/v1/auth/session")
        self.assertEqual(session_response.status_code, 200)
        self.assertTrue(session_response.json()["authenticated"])
        self.assertEqual(
            session_response.json()["user"]["email"],
            "frontend@example.com",
        )

    def test_logout_requires_csrf(self):
        login_response = self.login()
        self.assertEqual(login_response.status_code, 200)

        response = self.client.post("/api/v1/auth/logout")

        self.assertEqual(response.status_code, 403)

    def test_logout_ends_the_session_and_is_idempotent(self):
        login_response = self.login()
        self.assertEqual(login_response.status_code, 200)

        rotated_token = self.client.cookies["csrftoken"].value
        logout_response = self.client.post(
            "/api/v1/auth/logout",
            HTTP_X_CSRFTOKEN=rotated_token,
        )

        self.assertEqual(logout_response.status_code, 204)
        self.assertEqual(
            self.client.get("/api/v1/auth/session").json(),
            {
                "authenticated": False,
                "user": None,
            },
        )

        anonymous_token = self.csrf_token()
        second_logout_response = self.client.post(
            "/api/v1/auth/logout",
            HTTP_X_CSRFTOKEN=anonymous_token,
        )
        self.assertEqual(second_logout_response.status_code, 204)
