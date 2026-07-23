from unittest.mock import call, patch

from django.contrib.auth import get_user_model
from django.test import TestCase


class ApiTests(TestCase):
    @patch("config.api._database_status", return_value="ok")
    def test_health_endpoint_reports_both_databases(self, database_status):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "databases": {
                    "core": {"alias": "default", "status": "ok"},
                    "registry": {"alias": "registry", "status": "ok"},
                },
            },
        )
        self.assertEqual(
            database_status.call_args_list,
            [call("default"), call("registry")],
        )

    @patch("config.api._database_status", side_effect=["ok", "error"])
    def test_health_endpoint_is_degraded_when_a_database_is_unavailable(
        self,
        database_status,
    ):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "status": "degraded",
                "databases": {
                    "core": {"alias": "default", "status": "ok"},
                    "registry": {"alias": "registry", "status": "error"},
                },
            },
        )
        self.assertEqual(
            database_status.call_args_list,
            [call("default"), call("registry")],
        )

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
