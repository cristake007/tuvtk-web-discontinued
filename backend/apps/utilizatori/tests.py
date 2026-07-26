import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import Client, TestCase
from rest_framework.test import APIClient

from apps.core.models import ApplicationDefinition


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
        payload = response.json()
        self.assertEqual(payload["code"], "csrf_failed")
        self.assertEqual(
            payload["detail"],
            "Tokenul de securitate lipsește sau nu mai este valid.",
        )
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

    def test_superuser_can_manage_group_application_access(self):
        application = ApplicationDefinition.objects.create(
            key="test-application",
            name="Aplicație test",
        )

        response = self.client.post(
            "/api/v1/utilizatori/grupuri",
            {
                "name": "Operatori",
                "application_ids": [application.id, application.id],
                "user_ids": [self.regular_user.id, self.regular_user.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["applications"][0]["key"], "test-application")
        self.assertEqual(response.data["users"][0]["username"], "maria.popescu")
        group = Group.objects.get(name="Operatori")
        self.assertTrue(application.allowed_groups.filter(pk=group.pk).exists())
        self.assertTrue(self.regular_user.groups.filter(pk=group.pk).exists())

    def test_group_rejects_uncontrolled_or_inactive_application(self):
        application = ApplicationDefinition.objects.create(
            key="uncontrolled",
            name="Necontrolată",
            is_access_controlled=False,
        )

        response = self.client.post(
            "/api/v1/utilizatori/grupuri",
            {"name": "Fără acces", "application_ids": [application.id], "user_ids": []},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("application_ids", response.data)

    def test_user_list_includes_and_filters_django_groups(self):
        group = Group.objects.create(name="Planificator")
        self.regular_user.groups.add(group)

        response = self.client.get("/api/v1/utilizatori/", {"group": group.id})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["groups"], [{"id": group.id, "name": "Planificator"}])

    def test_user_api_returns_direct_inherited_and_effective_applications(self):
        inherited_application = ApplicationDefinition.objects.create(
            key="inherited", name="Moștenită"
        )
        direct_application = ApplicationDefinition.objects.create(
            key="direct", name="Directă"
        )
        group = Group.objects.create(name="Cu acces moștenit")
        inherited_application.allowed_groups.add(group)
        self.regular_user.groups.add(group)
        direct_application.allowed_users.add(self.regular_user)

        response = self.client.get(f"/api/v1/utilizatori/{self.regular_user.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["direct_applications"][0]["key"], "direct")
        self.assertEqual(response.data["inherited_applications"][0]["key"], "inherited")
        self.assertEqual(
            {application["key"] for application in response.data["effective_applications"]},
            {"direct", "inherited"},
        )

    def test_removing_direct_access_does_not_remove_group_access(self):
        application = ApplicationDefinition.objects.create(
            key="combined-access", name="Acces combinat"
        )
        group = Group.objects.create(name="Acces grup")
        application.allowed_groups.add(group)
        application.allowed_users.add(self.regular_user)
        self.regular_user.groups.add(group)

        response = self.client.patch(
            f"/api/v1/utilizatori/{self.regular_user.pk}",
            {"direct_application_ids": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["direct_applications"], [])
        self.assertEqual(
            [application_data["key"] for application_data in response.data["effective_applications"]],
            ["combined-access"],
        )

    def test_superuser_cannot_modify_direct_application_access(self):
        application = ApplicationDefinition.objects.create(
            key="superuser-direct", name="Acces superutilizator"
        )

        response = self.client.patch(
            f"/api/v1/utilizatori/{self.superuser.pk}",
            {"direct_application_ids": [application.id]},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("direct_application_ids", response.data)
        self.assertNotEqual(response.status_code, 404)

    def test_promoting_user_to_superuser_clears_direct_application_access(self):
        application = ApplicationDefinition.objects.create(
            key="promotion-direct", name="Acces înainte de promovare"
        )
        application.allowed_users.add(self.regular_user)

        self.regular_user.is_superuser = True
        self.regular_user.is_staff = True
        self.regular_user.save(update_fields=("is_superuser", "is_staff"))

        self.assertFalse(self.regular_user.directly_allowed_applications.exists())
