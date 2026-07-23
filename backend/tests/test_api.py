from django.contrib.auth import get_user_model
from django.test import TestCase


class ApiTests(TestCase):
    def test_health_endpoint_checks_core_database(self):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok"})

    def test_openapi_schema_is_available(self):
        response = self.client.get("/api/v1/openapi.json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["info"]["title"], "TUVTK API")

    def test_current_user_requires_authentication(self):
        response = self.client.get("/api/v1/me")

        self.assertEqual(response.status_code, 401)

    def test_current_user_returns_authenticated_user(self):
        user = get_user_model().objects.create_user(
            username="api-user",
            email="api-user@example.com",
            first_name="API",
            last_name="User",
            password="test-password-123",
        )
        self.client.force_login(user)

        response = self.client.get("/api/v1/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": user.pk,
                "username": "api-user",
                "email": "api-user@example.com",
                "first_name": "API",
                "last_name": "User",
                "is_staff": False,
                "is_superuser": False,
            },
        )
