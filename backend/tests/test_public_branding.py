from django.test import TestCase

from apps.core.models import ApplicationConfiguration


class PublicBrandingApiTests(TestCase):
    def setUp(self):
        ApplicationConfiguration.objects.all().delete()
        self.configuration = ApplicationConfiguration.objects.create(
            site_name="TUVTK",
            organization_name="TÜV Thüringen Karpat",
            sidebar_title="Workspace",
            company_logo_svg=(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">'
                '<rect width="120" height="40" fill="#164194"/>'
                "</svg>"
            ),
        )

    def test_anonymous_user_can_read_public_branding(self):
        response = self.client.get("/api/v1/core/branding")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["site_name"], "TUVTK")
        self.assertEqual(
            response.json()["organization_name"],
            "TÜV Thüringen Karpat",
        )
        self.assertTrue(
            response.json()["logo_url"].startswith("/api/v1/core/company-logo")
        )
        self.assertNotIn("sidebar_title", response.json())

    def test_anonymous_user_can_read_sanitized_company_logo(self):
        branding_response = self.client.get("/api/v1/core/branding")
        logo_response = self.client.get(branding_response.json()["logo_url"])

        self.assertEqual(logo_response.status_code, 200)
        self.assertTrue(logo_response["Content-Type"].startswith("image/svg+xml"))
        self.assertEqual(
            logo_response["Cache-Control"],
            "public, max-age=31536000, immutable",
        )
        self.assertEqual(logo_response["X-Content-Type-Options"], "nosniff")
