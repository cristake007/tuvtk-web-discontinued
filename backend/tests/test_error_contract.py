from django.test import TestCase, override_settings


class ApiErrorContractTests(TestCase):
    def test_serializer_validation_errors_use_standard_shape(self):
        response = self.client.post(
            "/api/v1/auth/login",
            data={},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertEqual(payload["code"], "validation_error")
        self.assertIsInstance(payload["detail"], str)
        self.assertIn("username", payload["fields"])
        self.assertIn("password", payload["fields"])

    @override_settings(DEBUG=False)
    def test_unmatched_api_route_uses_standard_shape(self):
        response = self.client.get("/api/v1/does-not-exist")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(
            response.json(),
            {
                "code": "not_found",
                "detail": "Resursa API solicitată nu există.",
                "fields": {},
            },
        )
