from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import ApplicationConfiguration

USER_INTERFACE_PATH = "/api/v1/core/administration/user-interface"


class UserInterfaceAdministrationApiTests(TestCase):
    def setUp(self):
        ApplicationConfiguration.objects.all().delete()
        self.configuration = ApplicationConfiguration.objects.create(
            site_name="TUVTK",
            organization_name="TÜV Thüringen Karpat",
            sidebar_title="Navigație",
            is_active=True,
        )

    def test_staff_user_can_read_user_interface_settings(self):
        user = get_user_model().objects.create_user(
            username="interface-admin",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get(USER_INTERFACE_PATH)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["site_name"], "TUVTK")
        self.assertEqual(
            response.json()["organization_name"],
            "TÜV Thüringen Karpat",
        )
        self.assertIsNone(response.json()["logo_url"])

    def test_regular_user_cannot_read_user_interface_settings(self):
        user = get_user_model().objects.create_user(
            username="regular-interface-user",
            password="test-password-123",
        )
        self.client.force_login(user)

        response = self.client.get(USER_INTERFACE_PATH)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "permission_denied")

    def test_legacy_settings_endpoint_is_not_available(self):
        user = get_user_model().objects.create_user(
            username="legacy-path-admin",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/settings/company-logo")

        self.assertEqual(response.status_code, 404)
