from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.core.models import ApplicationDefinition

from .models import Companie
from .services import archive_company, normalize_cui, restore_company


class CompanieModelTests(TestCase):
    def test_cui_normalization(self):
        self.assertEqual(normalize_cui(" ro 12 345 "), "12345")
        self.assertEqual(normalize_cui(" 12345 "), "12345")
        self.assertEqual(normalize_cui(""), "")

    def test_model_save_normalizes_cui(self):
        company = Companie.objects.create(
            name="Prima", cui=" ro 12 345 ", vat_status=Companie.VatStatus.TVA_NEPLATITOR
        )
        self.assertEqual(company.cui, "12345")

    def test_multiple_companies_without_cui_are_allowed(self):
        Companie.objects.create(name="Prima", cui="", vat_status=Companie.VatStatus.TVA_NEPLATITOR)
        Companie.objects.create(name="A doua", cui="", vat_status=Companie.VatStatus.TVA_NEPLATITOR)
        self.assertEqual(Companie.objects.count(), 2)

    def test_present_cui_is_unique(self):
        Companie.objects.create(
            name="Prima", cui="123", vat_status=Companie.VatStatus.TVA_NEPLATITOR
        )
        with self.assertRaises(IntegrityError):
            Companie.objects.create(
                name="A doua", cui="123", vat_status=Companie.VatStatus.TVA_NEPLATITOR
            )

    def test_archive_restore_round_trip(self):
        company = Companie.objects.create(
            name="Prima", vat_status=Companie.VatStatus.TVA_NEPLATITOR
        )
        archive_company(company)
        self.assertTrue(company.is_archived)
        self.assertIsNotNone(company.archived_at)
        restore_company(company)
        self.assertFalse(company.is_archived)
        self.assertIsNone(company.archived_at)


class CompanieApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="operator", password="secret-test-password"
        )
        self.other = get_user_model().objects.create_user(
            username="responsabil", password="secret-test-password"
        )
        self.application = ApplicationDefinition.objects.get(key="companii")
        self.application.allowed_users.add(self.user)

    def authenticate(self):
        self.client.force_authenticate(self.user)

    def payload(self, **changes):
        return {
            "name": "Acme",
            "cui": "RO 12 345",
            "vat_status": "TVA_PLATITOR",
            "status": "ACTIV",
            **changes,
        }

    def test_unauthenticated_request_returns_401(self):
        response = self.client.get(reverse("api-v1:companii:companie-list"))
        self.assertEqual(response.status_code, 401)

    def test_user_without_application_access_returns_403(self):
        self.client.force_authenticate(self.other)
        response = self.client.get(reverse("api-v1:companii:companie-list"))
        self.assertEqual(response.status_code, 403)

    def test_create_and_update_company(self):
        self.authenticate()
        response = self.client.post(
            reverse("api-v1:companii:companie-list"), self.payload(), format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["cui"], "12345")
        detail_url = reverse("api-v1:companii:companie-detail", args=(response.data["id"],))
        response = self.client.patch(detail_url, {"name": "Acme România"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Acme România")

    def test_choices_and_cui_are_validated(self):
        self.authenticate()
        url = reverse("api-v1:companii:companie-list")
        self.assertEqual(
            self.client.post(url, self.payload(status="INVALID"), format="json").status_code, 400
        )
        self.assertEqual(
            self.client.post(url, self.payload(cui="RO12A"), format="json").status_code, 400
        )

    def test_filter_sort_and_pagination(self):
        self.authenticate()
        Companie.objects.create(
            name="Zulu", status="INACTIV", vat_status="TVA_NEPLATITOR", owner=self.other
        )
        Companie.objects.create(name="Alpha", status="ACTIV", vat_status="TVA_PLATITOR")
        url = reverse("api-v1:companii:companie-list")
        response = self.client.get(
            url, {"status": "INACTIV", "owner": self.other.pk, "ordering": "name", "page_size": 1}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Zulu")

    def test_archive_and_restore_actions(self):
        self.authenticate()
        company = Companie.objects.create(name="Acme", vat_status="TVA_NEPLATITOR")
        archive = reverse("api-v1:companii:companie-archive", args=(company.pk,))
        restore = reverse("api-v1:companii:companie-restore", args=(company.pk,))
        self.assertTrue(self.client.post(archive).data["is_archived"])
        self.assertFalse(self.client.post(restore).data["is_archived"])
