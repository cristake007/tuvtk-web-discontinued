from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from .models import ApplicationConfiguration, ApplicationDefinition, NavigationItem


VALID_LOGO = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
<rect width="120" height="40" fill="#164194"/>
<text x="10" y="26" fill="white">TUVTK</text>
</svg>"""


class CoreBootstrapApiTests(TestCase):
    def setUp(self):
        NavigationItem.objects.all().delete()
        ApplicationDefinition.objects.all().delete()
        ApplicationConfiguration.objects.all().delete()

        self.core_application = ApplicationDefinition.objects.create(
            key="core",
            name="Core",
            route_prefix="/",
            position=10,
        )
        self.companies_application = ApplicationDefinition.objects.create(
            key="companies",
            name="Companies",
            route_prefix="/companies",
            position=20,
        )
        self.configuration = ApplicationConfiguration.objects.create(
            site_name="TUVTK",
            organization_name="TÜV Thüringen Karpat",
            sidebar_title="Workspace",
        )
        NavigationItem.objects.create(
            application=self.core_application,
            key="dashboard",
            label="Dashboard",
            path="/",
            icon="layout-dashboard",
            position=10,
        )
        NavigationItem.objects.create(
            application=self.companies_application,
            key="companies",
            label="Companies",
            path="/companies",
            icon="building-2",
            position=20,
        )
        NavigationItem.objects.create(
            application=self.core_application,
            key="settings",
            label="Settings",
            path="/settings",
            icon="settings",
            position=90,
            requires_staff=True,
        )

    def create_user(self, username: str, *, is_staff: bool = False):
        return get_user_model().objects.create_user(
            username=username,
            password="test-password-123",
            is_staff=is_staff,
        )

    def test_bootstrap_requires_authentication(self):
        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 401)

    def test_regular_user_receives_permitted_navigation(self):
        user = self.create_user("regular-user")
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "companies"],
        )
        self.assertEqual(
            [item["application_key"] for item in response.json()["navigation"]],
            ["core", "companies"],
        )
        self.assertIsNone(response.json()["configuration"]["logo_url"])
        self.assertEqual(response.json()["user"]["username"], "regular-user")

    def test_staff_user_receives_staff_navigation(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "companies", "settings"],
        )

    def test_disabled_application_hides_its_navigation(self):
        self.companies_application.is_enabled = False
        self.companies_application.save(update_fields=("is_enabled", "updated_at"))
        user = self.create_user("regular-user")
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard"],
        )

    def test_staff_user_can_upload_and_read_svg_logo(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)
        logo = SimpleUploadedFile(
            "company-logo.svg",
            VALID_LOGO,
            content_type="image/svg+xml",
        )

        response = self.client.post(
            "/api/v1/core/settings/company-logo",
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["logo_url"].startswith("/api/v1/core/company-logo"))

        self.configuration.refresh_from_db()
        self.assertIn("<svg", self.configuration.company_logo_svg)

        logo_response = self.client.get(response.json()["logo_url"])
        self.assertEqual(logo_response.status_code, 200)
        self.assertTrue(
            logo_response["Content-Type"].startswith("image/svg+xml")
        )
        self.assertEqual(logo_response["X-Content-Type-Options"], "nosniff")

    def test_regular_user_cannot_change_company_logo(self):
        user = self.create_user("regular-user")
        self.client.force_login(user)
        logo = SimpleUploadedFile(
            "company-logo.svg",
            VALID_LOGO,
            content_type="image/svg+xml",
        )

        response = self.client.post(
            "/api/v1/core/settings/company-logo",
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 403)

    def test_unsafe_svg_is_rejected(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)
        logo = SimpleUploadedFile(
            "unsafe.svg",
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            content_type="image/svg+xml",
        )

        response = self.client.post(
            "/api/v1/core/settings/company-logo",
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 400)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.company_logo_svg, "")

    def test_staff_user_can_remove_company_logo(self):
        self.configuration.company_logo_svg = VALID_LOGO.decode("utf-8")
        self.configuration.save(update_fields=("company_logo_svg", "updated_at"))
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)

        response = self.client.delete("/api/v1/core/settings/company-logo")

        self.assertEqual(response.status_code, 204)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.company_logo_svg, "")
