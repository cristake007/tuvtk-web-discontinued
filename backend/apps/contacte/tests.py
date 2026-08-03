import json

from django.contrib.auth import get_user_model
from django.db import connection
from django.test import Client, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.test import APIClient

from apps.companii.models import Companie
from apps.core.models import ApplicationDefinition

from .models import Contact


class ContactApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="operator", password="secret")
        self.other = get_user_model().objects.create_user(username="responsabil", password="secret")
        ApplicationDefinition.objects.get(key="contacte").allowed_users.add(self.user)
        self.company = Companie.objects.create(name="Acme", vat_status="TVA_NEPLATITOR")

    def authenticate(self):
        self.client.force_authenticate(self.user)

    def payload(self, **changes):
        return {"first_name": "Ana", "last_name": "Popescu", "company": self.company.pk, "status": "ACTIV", **changes}

    def test_authentication_and_application_access(self):
        url = reverse("api-v1:contacte:contact-list")
        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(url).status_code, 403)

    def test_create_update_and_validation(self):
        self.authenticate()
        url = reverse("api-v1:contacte:contact-list")
        self.assertEqual(self.client.post(url, self.payload(company=None), format="json").status_code, 400)
        self.assertEqual(self.client.post(url, self.payload(email="invalid"), format="json").status_code, 400)
        response = self.client.post(url, self.payload(email="ana@example.test"), format="json")
        self.assertEqual(response.status_code, 201)
        detail = reverse("api-v1:contacte:contact-detail", args=(response.data["id"],))
        response = self.client.patch(detail, {"job_title": "Director"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["job_title"], "Director")

    def test_filter_sort_pagination_and_search(self):
        self.authenticate()
        Contact.objects.create(first_name="Zulu", last_name="Ionescu", company=self.company, owner=self.other, status="INACTIV", is_archived=True)
        Contact.objects.create(first_name="Beta", last_name="Albu", company=self.company)
        response = self.client.get(reverse("api-v1:contacte:contact-list"), {"company": self.company.pk, "status": "INACTIV", "owner": self.other.pk, "archived": "true", "search": "Acme", "ordering": "last_name", "page_size": 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["first_name"], "Zulu")

    def test_archive_restore_and_archived_company(self):
        self.authenticate()
        self.company.is_archived = True
        self.company.save()
        contact = Contact.objects.create(first_name="Ana", last_name="Pop", company=self.company)
        detail = self.client.get(reverse("api-v1:contacte:contact-detail", args=(contact.pk,)))
        self.assertTrue(detail.data["company_detail"]["is_archived"])
        archive = reverse("api-v1:contacte:contact-archive", args=(contact.pk,))
        restore = reverse("api-v1:contacte:contact-restore", args=(contact.pk,))
        self.assertTrue(self.client.post(archive).data["is_archived"])
        self.assertFalse(self.client.post(restore).data["is_archived"])

    def test_list_has_bounded_queries(self):
        self.authenticate()
        for index in range(8):
            Contact.objects.create(first_name=f"Prenume {index}", last_name="Pop", company=self.company, owner=self.other)
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(reverse("api-v1:contacte:contact-list"))
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(queries), 5)

    def test_browser_session_create_requires_csrf(self):
        browser = Client(enforce_csrf_checks=True)
        browser.force_login(self.user)
        response = browser.post(reverse("api-v1:contacte:contact-list"), data=json.dumps(self.payload()), content_type="application/json")
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Contact.objects.exists())
