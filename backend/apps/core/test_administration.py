import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import ApplicationConfiguration, ApplicationDefinition, NavigationItem

USER_INTERFACE_PATH = "/api/v1/core/administration/user-interface"
USER_INTERFACE_NAVIGATION_PATH = f"{USER_INTERFACE_PATH}/navigation"


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
        self.assertEqual(response.json()["culoare_titluri"], "#1b2230")
        self.assertEqual(response.json()["font_scale"], 1.0)

    def test_regular_user_cannot_read_user_interface_settings(self):
        user = get_user_model().objects.create_user(
            username="regular-interface-user",
            password="test-password-123",
        )
        self.client.force_login(user)

        response = self.client.get(USER_INTERFACE_PATH)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "permission_denied")

    def test_staff_user_can_update_application_name_and_colors(self):
        user = get_user_model().objects.create_user(
            username="interface-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.patch(
            USER_INTERFACE_PATH,
            data=json.dumps(
                {
                    "site_name": "Platforma mea",
                    "culoare_primara": "#123456",
                    "culoare_accent": "#654321",
                    "culoare_fundal": "#fafafa",
                    "culoare_titluri": "#246824",
                    "font_scale": 1.125,
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["site_name"], "Platforma mea")
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.culoare_primara, "#123456")
        self.assertEqual(self.configuration.culoare_accent, "#654321")
        self.assertEqual(self.configuration.culoare_fundal, "#fafafa")
        self.assertEqual(self.configuration.culoare_titluri, "#246824")
        self.assertEqual(self.configuration.font_scale, 1.125)

    def test_font_scale_must_be_one_of_the_supported_values(self):
        user = get_user_model().objects.create_user(
            username="font-scale-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.patch(
            USER_INTERFACE_PATH,
            data=json.dumps({"font_scale": 1.5}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.font_scale, 1.0)

    def test_staff_user_can_restore_standard_font_scale(self):
        self.configuration.font_scale = 1.125
        self.configuration.save(update_fields=("font_scale", "updated_at"))
        user = get_user_model().objects.create_user(
            username="standard-font-scale-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.patch(
            USER_INTERFACE_PATH,
            data=json.dumps({"font_scale": 1}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.font_scale, 1.0)

    def test_heading_color_must_be_a_six_digit_hex_value(self):
        user = get_user_model().objects.create_user(
            username="heading-color-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.patch(
            USER_INTERFACE_PATH,
            data=json.dumps({"culoare_titluri": "verde"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.configuration.refresh_from_db()
        self.assertEqual(self.configuration.culoare_titluri, "#1b2230")

    def test_staff_user_can_reorder_main_navigation(self):
        user = get_user_model().objects.create_user(
            username="navigation-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)
        initial_response = self.client.get(USER_INTERFACE_NAVIGATION_PATH)
        self.assertEqual(initial_response.status_code, 200)
        chei = [item["key"] for item in initial_response.json()]

        response = self.client.put(
            USER_INTERFACE_NAVIGATION_PATH,
            data=json.dumps({"chei": list(reversed(chei))}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["key"] for item in response.json()], list(reversed(chei)))
        first_item = NavigationItem.objects.get(key=chei[-1])
        last_item = NavigationItem.objects.get(key=chei[0])
        self.assertLess(first_item.position, last_item.position)

    def test_staff_user_can_create_and_remove_menu_separator(self):
        user = get_user_model().objects.create_user(
            username="separator-editor",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        create_response = self.client.post(
            USER_INTERFACE_NAVIGATION_PATH,
            data=json.dumps({"label": "  CRM  "}),
            content_type="application/json",
        )

        self.assertEqual(create_response.status_code, 201)
        separator_key = create_response.json()["key"]
        self.assertTrue(create_response.json()["is_separator"])
        self.assertEqual(create_response.json()["label"], "CRM")
        self.assertTrue(
            NavigationItem.objects.filter(key=separator_key, label="CRM").exists()
        )

        remove_response = self.client.delete(
            f"{USER_INTERFACE_NAVIGATION_PATH}/separators/{separator_key}"
        )

        self.assertEqual(remove_response.status_code, 204)
        self.assertFalse(NavigationItem.objects.filter(key=separator_key).exists())

    def test_separator_title_cannot_be_empty(self):
        user = get_user_model().objects.create_user(
            username="separator-empty-title",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.post(
            USER_INTERFACE_NAVIGATION_PATH,
            data=json.dumps({"label": "   "}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_separator_title_cannot_exceed_60_characters(self):
        user = get_user_model().objects.create_user(
            username="separator-long-title",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.post(
            USER_INTERFACE_NAVIGATION_PATH,
            data=json.dumps({"label": "a" * 61}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_staff_user_can_rename_menu_separator(self):
        user = get_user_model().objects.create_user(
            username="separator-renamer",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)
        separator = NavigationItem.objects.create(
            application=ApplicationDefinition.objects.get(key="core"),
            key="separator-de-redenumit",
            label="CRM",
            path="",
            position=100,
            is_separator=True,
        )

        response = self.client.patch(
            f"{USER_INTERFACE_NAVIGATION_PATH}/separators/{separator.key}",
            data=json.dumps({"label": "  Operațional  "}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["label"], "Operațional")
        separator.refresh_from_db()
        self.assertEqual(separator.label, "Operațional")

    def test_normal_navigation_item_cannot_be_updated_as_separator(self):
        user = get_user_model().objects.create_user(
            username="separator-restriction",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)
        item = NavigationItem.objects.filter(
            parent__isnull=True,
            is_separator=False,
        ).first()
        self.assertIsNotNone(item)

        response = self.client.patch(
            f"{USER_INTERFACE_NAVIGATION_PATH}/separators/{item.key}",
            data=json.dumps({"label": "Titlu nou"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        item.refresh_from_db()
        self.assertNotEqual(item.label, "Titlu nou")

    def test_legacy_settings_endpoint_is_not_available(self):
        user = get_user_model().objects.create_user(
            username="legacy-path-admin",
            password="test-password-123",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get("/api/v1/core/settings/company-logo")

        self.assertEqual(response.status_code, 404)
