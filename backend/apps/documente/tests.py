from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import ApplicationDefinition


class RezumatDocumenteApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.utilizator = get_user_model().objects.create_user(
            username="utilizator-documente",
            password="parola-temporara",
        )

    def test_neautentificat_primeste_401(self):
        raspuns = self.client.get("/api/v1/documente/rezumat")

        self.assertEqual(raspuns.status_code, 401)

    def test_utilizator_autentificat_primeste_rezumatul(self):
        application, _ = ApplicationDefinition.objects.get_or_create(
            key="documente",
            defaults={"name": "Documente"},
        )
        group = Group.objects.create(name="Documente")
        application.allowed_groups.add(group)
        self.utilizator.groups.add(group)
        self.client.force_authenticate(self.utilizator)

        raspuns = self.client.get("/api/v1/documente/rezumat")

        self.assertEqual(raspuns.status_code, 200)
        self.assertEqual(raspuns.data["titlu"], "Documente")
        self.assertEqual(raspuns.data["documente"], [])

    def test_utilizator_fara_grup_primeste_403(self):
        self.client.force_authenticate(self.utilizator)

        raspuns = self.client.get("/api/v1/documente/rezumat")

        self.assertEqual(raspuns.status_code, 403)

    def test_utilizator_cu_acces_direct_primeste_rezumatul(self):
        application, _ = ApplicationDefinition.objects.get_or_create(
            key="documente",
            defaults={"name": "Documente"},
        )
        application.allowed_users.add(self.utilizator)
        self.client.force_authenticate(self.utilizator)

        raspuns = self.client.get("/api/v1/documente/rezumat")

        self.assertEqual(raspuns.status_code, 200)
