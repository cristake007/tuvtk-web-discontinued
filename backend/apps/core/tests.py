from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import ApplicationConfiguration, NavigationItem


class CoreBootstrapApiTests(TestCase):
    def setUp(self):
        ApplicationConfiguration.objects.all().delete()
        NavigationItem.objects.all().delete()

        ApplicationConfiguration.objects.create(
            site_name="TUVTK",
            organization_name="TÜV Thüringen Karpat",
            sidebar_title="Workspace",
        )
        NavigationItem.objects.create(
            key="dashboard",
            label="Dashboard",
            path="/",
            icon="layout-dashboard",
            position=10,
        )
        NavigationItem.objects.create(
            key="settings",
            label="Settings",
            path="/settings",
            icon="settings",
            position=90,
            requires_staff=True,
        )

    def test_bootstrap_is_available_without_authentication(self):
        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["configuration"]["site_name"], "TUVTK")
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard"],
        )
        self.assertIsNone(response.json()["user"])

    def test_staff_user_receives_staff_navigation(self):
        user = get_user_model().objects.create_user(
            username="staff-user",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "settings"],
        )
        self.assertEqual(response.json()["user"]["username"], "staff-user")
