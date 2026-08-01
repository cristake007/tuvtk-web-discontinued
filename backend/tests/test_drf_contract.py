from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase


class DrfSessionContractTests(TestCase):
    def test_authenticated_unsafe_request_requires_csrf(self):
        user = get_user_model().objects.create_user(
            username="csrf-staff",
            password="test-password-123",
            is_staff=True,
        )
        client = Client(enforce_csrf_checks=True)
        client.force_login(user)
        logo = SimpleUploadedFile(
            "company-logo.svg",
            b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>',
            content_type="image/svg+xml",
        )

        response = client.post(
            "/api/v1/core/administration/user-interface/company-logo",
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 403)
