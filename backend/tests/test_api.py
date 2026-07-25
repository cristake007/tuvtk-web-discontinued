from unittest.mock import call, patch

from django.contrib.auth import get_user_model
from django.test import TestCase


class ApiTests(TestCase):
    @patch("config.api_views.database_status", return_value="ok")
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

    @patch("config.api_views.database_status", side_effect=["ok", "error"])
    def test_health_endpoint_is_degraded_but_available_when_registry_is_offline(
        self,
        database_status,
    ):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
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

    @patch("config.api_views.database_status", side_effect=["ok", "disabled"])
    def test_health_endpoint_is_available_when_registry_is_disabled(
        self,
        database_status,
    ):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertEqual(
            response.json()["databases"]["registry"],
            {"alias": "registry", "status": "disabled"},
        )

    @patch("config.api_views.database_status", side_effect=["error", "ok"])
    def test_health_endpoint_returns_unavailable_when_core_is_offline(
        self,
        database_status,
    ):
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertEqual(
            response.json()["databases"]["core"],
            {"alias": "default", "status": "error"},
        )

    def test_openapi_schema_requires_staff_access(self):
        response = self.client.get("/api/schema?format=json")

        self.assertIn(response.status_code, {401, 403})

    def test_staff_user_can_read_openapi_schema(self):
        user = get_user_model().objects.create_user(
            username="schema-admin",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get("/api/schema?format=json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["info"]["title"], "TUVTK API")
        self.assertIn("/api/v1/core/bootstrap", response.json()["paths"])
