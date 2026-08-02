from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase, override_settings
from django.urls import reverse


class AuthenticatedMediaViewTests(TestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.media_override.enable()

    def tearDown(self):
        self.media_override.disable()
        self.media_directory.cleanup()

    def test_anonymous_request_is_rejected(self):
        response = self.client.get(reverse("media", args=["private/report.pdf"]))

        self.assertEqual(response.status_code, 401)

    def test_authenticated_request_uses_internal_nginx_redirect(self):
        default_storage.save("private/raport final.pdf", ContentFile(b"secret"))
        self.client.force_login(self.create_user())

        response = self.client.get(reverse("media", args=["private/raport final.pdf"]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response["X-Accel-Redirect"],
            "/_protected_media/private/raport%20final.pdf",
        )
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.assertEqual(response.content, b"")

    def test_missing_file_returns_not_found(self):
        self.client.force_login(self.create_user())

        response = self.client.get(reverse("media", args=["private/missing.pdf"]))

        self.assertEqual(response.status_code, 404)

    @staticmethod
    def create_user():
        return get_user_model().objects.create_user(
            username="media-user",
            password="test-password-123",
        )
