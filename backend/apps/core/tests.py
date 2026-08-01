from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from .models import ApplicationConfiguration, ApplicationDefinition, NavigationItem
from .svg import MAX_SVG_LOGO_BYTES

VALID_LOGO = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
<rect width="120" height="40" fill="#164194"/>
<text x="10" y="26" fill="white">TUVTK</text>
</svg>"""

USER_INTERFACE_LOGO_PATH = (
    "/api/v1/core/administration/user-interface/company-logo"
)


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
            is_access_controlled=False,
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
            key="administration",
            label="Administrare",
            path="/administrare",
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

    def test_anonymous_bootstrap_returns_branding_and_authentication_state(self):
        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["authenticated"], False)
        self.assertIsNone(response.json()["user"])
        self.assertEqual(response.json()["navigation"], [])
        self.assertEqual(response.json()["configuration"]["site_name"], "TUVTK")
        self.assertEqual(
            response.json()["configuration"]["culoare_titluri"],
            "#1b2230",
        )

    def test_public_branding_returns_heading_color(self):
        self.configuration.culoare_titluri = "#246824"
        self.configuration.save(update_fields=("culoare_titluri", "updated_at"))

        response = self.client.get("/api/v1/core/branding")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["culoare_titluri"], "#246824")

    def test_regular_user_receives_permitted_navigation(self):
        user = self.create_user("regular-user")
        group = Group.objects.create(name="Companii")
        self.companies_application.allowed_groups.add(group)
        user.groups.add(group)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["authenticated"])
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
        self.assertEqual(response.json()["accessible_application_keys"], ["companies"])

    def test_user_without_group_sees_only_dashboard(self):
        user = self.create_user("without-group")
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard"],
        )
        self.assertEqual(response.json()["accessible_application_keys"], [])

    def test_user_with_direct_access_receives_application_navigation(self):
        user = self.create_user("direct-user")
        self.companies_application.allowed_users.add(user)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "companies"],
        )
        self.assertEqual(response.json()["accessible_application_keys"], ["companies"])

    def test_group_and_direct_access_are_combined(self):
        documents_application = ApplicationDefinition.objects.create(
            key="documents",
            name="Documente",
            route_prefix="/documente",
            position=30,
        )
        NavigationItem.objects.create(
            application=documents_application,
            key="documents",
            label="Documente",
            path="/documente",
            position=30,
        )
        user = self.create_user("combined-user")
        group = Group.objects.create(name="Companii")
        self.companies_application.allowed_groups.add(group)
        user.groups.add(group)
        documents_application.allowed_users.add(user)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            response.json()["accessible_application_keys"],
            ["companies", "documents"],
        )

    def test_removing_direct_access_removes_application_navigation(self):
        user = self.create_user("direct-removal-user")
        self.companies_application.allowed_users.add(user)
        self.companies_application.allowed_users.remove(user)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard"],
        )

    def test_staff_user_receives_staff_navigation(self):
        user = self.create_user("staff-user", is_staff=True)
        group = Group.objects.create(name="Companii")
        self.companies_application.allowed_groups.add(group)
        user.groups.add(group)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "companies", "administration"],
        )

    def test_superuser_sees_all_active_applications(self):
        user = get_user_model().objects.create_superuser(
            username="superuser",
            password="test-password-123",
        )
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "companies", "administration"],
        )
        self.assertIn("companies", response.json()["accessible_application_keys"])

    def test_staff_user_without_groups_sees_administration_but_not_business_apps(self):
        user = self.create_user("staff-without-groups", is_staff=True)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "administration"],
        )

    def test_staff_user_with_contact_access_sees_only_contacts_and_administration(self):
        contacts_application = ApplicationDefinition.objects.create(
            key="contacts",
            name="Contacte",
            route_prefix="/contacts",
            position=30,
        )
        NavigationItem.objects.create(
            application=contacts_application,
            key="contacts",
            label="Contacte",
            path="/contacts",
            position=30,
        )
        user = self.create_user("staff-contacts", is_staff=True)
        group = Group.objects.create(name="Contacte")
        contacts_application.allowed_groups.add(group)
        user.groups.add(group)
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "contacts", "administration"],
        )

    def test_removing_superuser_status_reactivates_regular_acl(self):
        user = get_user_model().objects.create_superuser(
            username="former-superuser",
            password="test-password-123",
        )
        self.client.force_login(user)
        user.is_superuser = False
        user.save(update_fields=("is_superuser",))

        response = self.client.get("/api/v1/core/bootstrap")

        self.assertEqual(
            [item["key"] for item in response.json()["navigation"]],
            ["dashboard", "administration"],
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
            USER_INTERFACE_LOGO_PATH,
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            response.json()["logo_url"].startswith("/api/v1/core/company-logo")
        )

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
            USER_INTERFACE_LOGO_PATH,
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "permission_denied")

    def test_unsafe_svg_is_rejected(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)
        logo = SimpleUploadedFile(
            "unsafe.svg",
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            content_type="image/svg+xml",
        )

        response = self.client.post(
            USER_INTERFACE_LOGO_PATH,
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "validation_error")
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.company_logo_svg, "")

    def test_external_svg_resource_is_rejected(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)
        logo = SimpleUploadedFile(
            "external.svg",
            b'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/logo.png"/></svg>',
            content_type="image/svg+xml",
        )

        response = self.client.post(
            USER_INTERFACE_LOGO_PATH,
            {"logo": logo},
        )

        self.assertEqual(response.status_code, 400)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.company_logo_svg, "")

    def test_oversized_svg_is_rejected(self):
        user = self.create_user("staff-user", is_staff=True)
        self.client.force_login(user)
        oversized_svg = (
            b'<svg xmlns="http://www.w3.org/2000/svg"><text>'
            + b"x" * MAX_SVG_LOGO_BYTES
            + b"</text></svg>"
        )
        logo = SimpleUploadedFile(
            "oversized.svg",
            oversized_svg,
            content_type="image/svg+xml",
        )

        response = self.client.post(
            USER_INTERFACE_LOGO_PATH,
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

        response = self.client.delete(USER_INTERFACE_LOGO_PATH)

        self.assertEqual(response.status_code, 204)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.company_logo_svg, "")
