import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from rest_framework.test import APIClient


class UtilizatoriApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.superuser = user_model.objects.create_superuser(
            username="platform-admin",
            email="admin@example.com",
            password="temporary-test-password",
        )
        self.staff_user = user_model.objects.create_user(
            username="staff-user",
            password="temporary-test-password",
            is_staff=True,
        )
        self.regular_user = user_model.objects.create_user(
            username="maria.popescu",
            first_name="Maria",
            last_name="Popescu",
            email="maria@example.com",
            password="temporary-test-password",
        )
        self.inactive_user = user_model.objects.create_user(
            username="inactive-user",
            password="temporary-test-password",
            is_active=False,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.superuser)

    def test_regular_user_cannot_access_user_management(self):
        self.client.force_authenticate(self.regular_user)

        response = self.client.get("/api/v1/utilizatori/")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "permission_denied")

    def test_staff_user_can_search_and_filter_users(self):
        self.client.force_authenticate(self.staff_user)

        response = self.client.get(
            "/api/v1/utilizatori/",
            {"search": "maria", "status": "active", "role": "user"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["results"][0]["username"], "maria.popescu")

    def test_invalid_filter_returns_standard_validation_error(self):
        response = self.client.get("/api/v1/utilizatori/", {"role": "owner"})

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertEqual(payload["code"], "validation_error")
        self.assertIn("role", payload["fields"])

    def test_browser_session_create_requires_csrf(self):
        browser = Client(enforce_csrf_checks=True)
        browser.force_login(self.superuser)

        response = browser.post(
            "/api/v1/utilizatori/",
            data=json.dumps(
                {
                    "username": "csrf-test",
                    "password": "A-secure-password-2026",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["code"], "csrf_failed")
        self.assertFalse(get_user_model().objects.filter(username="csrf-test").exists())

    def test_superuser_can_create_user_with_hashed_password(self):
        response = self.client.post(
            "/api/v1/utilizatori/",
            {
                "username": "ion.ionescu",
                "first_name": "Ion",
                "last_name": "Ionescu",
                "email": "ion@example.com",
                "password": "A-secure-password-2026",
                "is_active": True,
                "is_staff": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="ion.ionescu")
        self.assertTrue(user.check_password("A-secure-password-2026"))
        self.assertNotEqual(user.password, "A-secure-password-2026")

    def test_staff_user_cannot_grant_staff_access(self):
        self.client.force_authenticate(self.staff_user)

        response = self.client.post(
            "/api/v1/utilizatori/",
            {
                "username": "new-admin",
                "password": "A-secure-password-2026",
                "is_staff": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(get_user_model().objects.filter(username="new-admin").exists())

    def test_staff_user_cannot_modify_another_administrator(self):
        self.client.force_authenticate(self.staff_user)

        response = self.client.patch(
            f"/api/v1/utilizatori/{self.superuser.pk}",
            {"first_name": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.superuser.refresh_from_db()
        self.assertNotEqual(self.superuser.first_name, "Changed")

    def test_user_cannot_deactivate_own_account(self):
        response = self.client.patch(
            f"/api/v1/utilizatori/{self.superuser.pk}",
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "validation_error")
        self.superuser.refresh_from_db()
        self.assertTrue(self.superuser.is_active)

    def test_superuser_can_update_regular_user(self):
        response = self.client.patch(
            f"/api/v1/utilizatori/{self.regular_user.pk}",
            {
                "first_name": "Mariana",
                "is_active": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.first_name, "Mariana")
        self.assertFalse(self.regular_user.is_active)
