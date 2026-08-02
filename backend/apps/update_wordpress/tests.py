from datetime import date
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from apps.core.models import ApplicationDefinition

from .client import WordPressRequestError, WPCourseClient
from .domain import (
    build_final_program,
    extract_slug_from_permalink,
    parse_effective_end_date,
    parse_excel_dates_from_row,
    valid_existing_program,
)
from .files import UpdateWordPressFileError, parse_course_date_rows
from .validators import InvalidWordPressUrlError, validate_http_url_syntax, validate_public_http_url


class DomainTests(TestCase):
    def test_extract_slug_from_permalink(self):
        self.assertEqual(
            extract_slug_from_permalink("https://example.com/curs/auditor-iso-9001/"),
            "auditor-iso-9001",
        )
        self.assertEqual(extract_slug_from_permalink(""), "")

    def test_parse_effective_end_date_handles_single_and_range(self):
        self.assertEqual(parse_effective_end_date("11.01.2027"), date(2027, 1, 11))
        self.assertEqual(parse_effective_end_date("11-12.01.2027"), date(2027, 1, 12))
        self.assertIsNone(parse_effective_end_date("not a date"))

    def test_build_final_program_drops_expired_and_dedupes(self):
        today = date(2027, 1, 15)
        existing = [{"data": "01.01.2027"}, {"data": "20.01.2027"}]

        final = build_final_program(existing, ["20.01.2027", "25.01.2027"], today)

        self.assertEqual([row["data"] for row in final], ["20.01.2027", "25.01.2027"])

    def test_valid_existing_program_filters_expired_rows(self):
        today = date(2027, 1, 15)
        existing = [{"data": "01.01.2027"}, {"data": "20.01.2027"}]

        self.assertEqual(
            [row["data"] for row in valid_existing_program(existing, today)],
            ["20.01.2027"],
        )

    def test_parse_excel_dates_from_row_reads_month_columns(self):
        row = {"Title": "Curs", "January": "11.01.2027", "March": "05.03.2027"}

        self.assertEqual(parse_excel_dates_from_row(row), ["11.01.2027", "05.03.2027"])


class ValidatorsTests(TestCase):
    def test_rejects_non_http_scheme(self):
        with self.assertRaises(InvalidWordPressUrlError):
            validate_http_url_syntax("ftp://example.com")

    def test_rejects_credentials_in_url(self):
        with self.assertRaises(InvalidWordPressUrlError):
            validate_http_url_syntax("https://user:pass@example.com")

    def test_rejects_localhost(self):
        with self.assertRaises(InvalidWordPressUrlError):
            validate_http_url_syntax("http://localhost")

    def test_normalizes_default_port_and_trailing_slash(self):
        self.assertEqual(
            validate_http_url_syntax("https://example.com:443/site/"),
            "https://example.com/site",
        )

    @patch("apps.update_wordpress.validators.socket.getaddrinfo")
    def test_rejects_hostname_resolving_to_private_address(self, getaddrinfo):
        getaddrinfo.return_value = [(None, None, None, None, ("10.0.0.5", 443))]

        with self.assertRaises(InvalidWordPressUrlError):
            validate_public_http_url("https://internal.example.com")

    @patch("apps.update_wordpress.validators.socket.getaddrinfo")
    def test_allows_hostname_resolving_to_public_address(self, getaddrinfo):
        getaddrinfo.return_value = [(None, None, None, None, ("8.8.8.8", 443))]

        self.assertEqual(
            validate_public_http_url("https://example.com"),
            "https://example.com",
        )


class WordPressFileParsingTests(TestCase):
    def test_parse_course_date_rows_requires_title_and_permalink(self):
        with self.assertRaises(UpdateWordPressFileError):
            parse_course_date_rows(b"Nume;Data\nCurs;11.01.2027\n", ".csv")

    def test_parse_course_date_rows_reads_valid_rows(self):
        rows = parse_course_date_rows(
            b"Title;Permalink;January\nAuditor ISO 9001;/curs/auditor;11.01.2027\n",
            ".csv",
        )

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "Auditor ISO 9001")
        self.assertEqual(rows[0]["permalink"], "/curs/auditor")
        self.assertEqual(rows[0]["excel_dates"], ["11.01.2027"])


class WPCourseClientTests(TestCase):
    def test_get_course_by_slug_matches_exact_slug(self):
        client = WPCourseClient("https://example.com", "user", "pass")
        with patch.object(
            client,
            "_request_with_retries",
            return_value=(200, {}, b'[{"slug": "auditor-iso-9001", "id": 42}]'),
        ):
            course = client.get_course_by_slug("auditor-iso-9001")

        self.assertEqual(course, {"slug": "auditor-iso-9001", "id": 42})

    def test_resolve_course_post_id_uses_permalink_when_slug_missing(self):
        client = WPCourseClient("https://example.com", "user", "pass")
        with patch.object(
            client, "get_course_by_slug", return_value={"id": 7, "slug": "auditor"}
        ) as get_course_by_slug:
            post_id = client.resolve_course_post_id(
                permalink="https://example.com/curs/auditor/"
            )

        get_course_by_slug.assert_called_once_with("auditor")
        self.assertEqual(post_id, 7)

    def test_update_course_program_raises_client_error_on_invalid_response(self):
        client = WPCourseClient("https://example.com", "user", "pass")
        with patch.object(client, "_request_with_retries", return_value=(200, {}, b"null")):
            with self.assertRaises(WordPressRequestError):
                client.update_course_program(1, [{"data": "11.01.2027"}])


class UpdateWordPressApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="wp-updater-user",
            password="test-password-123",
        )
        application, _ = ApplicationDefinition.objects.get_or_create(
            key="planificator-cursuri",
            defaults={"name": "Planificator cursuri"},
        )
        application.is_enabled = True
        application.is_access_controlled = True
        application.save(update_fields=("is_enabled", "is_access_controlled", "updated_at"))
        group = Group.objects.create(name="WordPress updater test")
        application.allowed_groups.add(group)
        self.user.groups.add(group)
        self.client.force_login(self.user)

    def test_endpoints_require_application_access(self):
        user_without_permission = get_user_model().objects.create_user(
            username="no-wp-updater-access",
            password="test-password-123",
        )
        self.client.force_login(user_without_permission)

        responses = [
            self.client.get("/api/v1/update-wordpress/settings"),
            self.client.post(
                "/api/v1/update-wordpress/connect",
                data={"wp_base_url": "https://example.com", "wp_username": "u", "wp_app_password": "p"},
                content_type="application/json",
            ),
            self.client.post(
                "/api/v1/update-wordpress/preview",
                {"input_file": SimpleUploadedFile("a.csv", b"x")},
            ),
            self.client.post(
                "/api/v1/update-wordpress/resolve-post-id",
                data={"wp_base_url": "https://example.com", "slug": "auditor"},
                content_type="application/json",
            ),
        ]

        for response in responses:
            self.assertEqual(response.status_code, 403)

    @patch("apps.update_wordpress.views.build_wp_client")
    def test_connect_saves_settings_on_success(self, build_wp_client):
        fake_client = MagicMock()
        fake_client.test_connection.return_value = {"id": 3, "name": "Admin"}
        build_wp_client.return_value = fake_client

        response = self.client.post(
            "/api/v1/update-wordpress/connect",
            data={
                "wp_base_url": "https://example.com",
                "wp_username": "admin",
                "wp_app_password": "secret pass word",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"user_id": 3, "user_name": "Admin"})

        settings_response = self.client.get("/api/v1/update-wordpress/settings")
        self.assertEqual(
            settings_response.json(),
            {"wp_base_url": "https://example.com", "wp_username": "admin"},
        )

    @patch("apps.update_wordpress.views.build_wp_client")
    def test_connect_maps_wordpress_failure_to_bad_gateway(self, build_wp_client):
        fake_client = MagicMock()
        fake_client.test_connection.side_effect = WordPressRequestError(
            "Autentificarea la WordPress a eșuat."
        )
        build_wp_client.return_value = fake_client

        response = self.client.post(
            "/api/v1/update-wordpress/connect",
            data={
                "wp_base_url": "https://example.com",
                "wp_username": "admin",
                "wp_app_password": "wrong",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 502)

    def test_connect_rejects_invalid_base_url(self):
        response = self.client.post(
            "/api/v1/update-wordpress/connect",
            data={"wp_base_url": "ftp://example.com", "wp_username": "admin", "wp_app_password": "x"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_preview_returns_rows_from_uploaded_file(self):
        upload = SimpleUploadedFile(
            "cursuri.csv",
            b"Title;Permalink;January\nAuditor ISO 9001;/curs/auditor-iso-9001;11.01.2027\n",
            content_type="text/csv",
        )

        response = self.client.post("/api/v1/update-wordpress/preview", {"input_file": upload})

        self.assertEqual(response.status_code, 200)
        rows = response.json()["rows"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["slug"], "auditor-iso-9001")
        self.assertEqual(rows[0]["final_dates"], ["11.01.2027"])
        self.assertTrue(rows[0]["can_update"])

    def test_preview_flags_rows_missing_permalink(self):
        upload = SimpleUploadedFile(
            "cursuri.csv",
            b"Title;Permalink;January\nAuditor ISO 9001;;11.01.2027\n",
            content_type="text/csv",
        )

        response = self.client.post("/api/v1/update-wordpress/preview", {"input_file": upload})

        self.assertEqual(response.status_code, 200)
        row = response.json()["rows"][0]
        self.assertEqual(row["status"], "error")
        self.assertFalse(row["can_update"])

    @patch("apps.update_wordpress.views.build_wp_client")
    def test_update_row_returns_not_found_when_course_missing(self, build_wp_client):
        fake_client = MagicMock()
        fake_client.resolve_course_post_id.return_value = None
        build_wp_client.return_value = fake_client

        response = self.client.post(
            "/api/v1/update-wordpress/update-row",
            data={
                "wp_base_url": "https://example.com",
                "wp_username": "admin",
                "wp_app_password": "secret",
                "slug": "curs-inexistent",
                "final_dates": ["11.01.2027"],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    @patch("apps.update_wordpress.views.build_wp_client")
    def test_update_row_applies_changes_when_dates_differ(self, build_wp_client):
        fake_client = MagicMock()
        fake_client.resolve_course_post_id.return_value = 42
        fake_client.get_course.return_value = {"acf": {"program": [{"data": "01.01.2020"}]}}
        build_wp_client.return_value = fake_client

        response = self.client.post(
            "/api/v1/update-wordpress/update-row",
            data={
                "wp_base_url": "https://example.com",
                "wp_username": "admin",
                "wp_app_password": "secret",
                "slug": "auditor-iso-9001",
                "final_dates": ["11.01.2099"],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["updated"])
        fake_client.update_course_program.assert_called_once()

    def test_update_row_rejects_invalid_date(self):
        response = self.client.post(
            "/api/v1/update-wordpress/update-row",
            data={
                "wp_base_url": "https://example.com",
                "wp_username": "admin",
                "wp_app_password": "secret",
                "slug": "auditor",
                "final_dates": ["not-a-date"],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    @patch("apps.update_wordpress.views.build_wp_client")
    def test_resolve_post_id_returns_post_id(self, build_wp_client):
        fake_client = MagicMock()
        fake_client.resolve_course_post_id.return_value = 99
        build_wp_client.return_value = fake_client

        response = self.client.post(
            "/api/v1/update-wordpress/resolve-post-id",
            data={"wp_base_url": "https://example.com", "slug": "auditor-iso-9001"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"post_id": 99})
        build_wp_client.assert_called_once_with(
            wp_base_url="https://example.com", wp_username="", wp_app_password=""
        )
