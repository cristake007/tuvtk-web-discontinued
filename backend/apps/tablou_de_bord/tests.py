from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class RezumatTablouDeBordApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.utilizator = get_user_model().objects.create_user(
            username="utilizator-tablou",
            password="parola-temporara",
        )

    def test_neautentificat_primeste_401(self):
        raspuns = self.client.get("/api/v1/tablou-de-bord/rezumat")

        self.assertEqual(raspuns.status_code, 401)

    def test_utilizator_autentificat_primeste_rezumatul(self):
        self.client.force_authenticate(self.utilizator)

        raspuns = self.client.get("/api/v1/tablou-de-bord/rezumat")

        self.assertEqual(raspuns.status_code, 200)
        self.assertEqual(raspuns.data["titlu"], "Dashboard")
        self.assertEqual(raspuns.data["module"], [])
