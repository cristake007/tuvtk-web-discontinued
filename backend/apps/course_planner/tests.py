import io
from datetime import date

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from openpyxl import load_workbook

from .scheduler import CourseScheduler


class CourseSchedulerTests(TestCase):
    def test_short_course_stays_inside_work_week(self):
        scheduler = CourseScheduler(2027, [])

        available = scheduler.get_available_start_days(1, 5)

        self.assertTrue(available)
        self.assertTrue(all(value.weekday() == 0 for value in available))

    def test_long_course_formats_cross_month_range(self):
        scheduler = CourseScheduler(2027, [])

        date_range = scheduler.format_date_range(date(2027, 2, 15), 18)

        self.assertEqual(date_range, "15.02-10.03.2027")


class CoursePlannerApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="planner-user",
            password="test-password-123",
        )
        self.client.force_login(self.user)

    def course_file(self, content: bytes | None = None) -> SimpleUploadedFile:
        return SimpleUploadedFile(
            "cursuri.csv",
            content
            or (
                b"Title;Durata Curs;investitie;Permalink\n"
                b"Auditor ISO 9001;2 zile;350 EUR;/curs/auditor-iso-9001\n"
            ),
            content_type="text/csv",
        )

    def test_generate_requires_authentication(self):
        self.client.logout()

        response = self.client.post(
            "/api/v1/course-planner/generate",
            {
                "input_file": self.course_file(),
                "year": 2027,
                "months": "1",
                "randomness": 5,
                "holidays": "",
            },
        )

        self.assertEqual(response.status_code, 401)

    def test_generate_schedule_from_csv(self):
        response = self.client.post(
            "/api/v1/course-planner/generate",
            {
                "input_file": self.course_file(),
                "year": 2027,
                "months": "1,2",
                "randomness": 5,
                "holidays": "01.01.2027",
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["course_count"], 1)
        self.assertEqual(len(payload["schedule"]), 2)
        self.assertEqual(payload["schedule"][0]["title"], "Auditor ISO 9001")

    def test_invalid_input_columns_are_rejected(self):
        response = self.client.post(
            "/api/v1/course-planner/generate",
            {
                "input_file": self.course_file(b"Nume;Durata\nCurs;2\n"),
                "year": 2027,
                "months": "1",
                "randomness": 5,
                "holidays": "",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Coloana obligatorie", response.json()["detail"])

    def test_settings_can_be_updated(self):
        response = self.client.put(
            "/api/v1/course-planner/settings",
            data={
                "year": 2028,
                "months": [3, 4],
                "randomness": 7,
                "holidays": ["01.05.2028"],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["months"], [3, 4])

    def test_schedule_can_be_exported_to_excel(self):
        response = self.client.post(
            "/api/v1/course-planner/export",
            data={
                "year": 2027,
                "holidays": ["01.01.2027"],
                "schedule": [
                    {
                        "title": "Auditor ISO 9001",
                        "permalink": "/curs/auditor-iso-9001",
                        "duration_label": "2 zile",
                        "investment": "350 EUR",
                        "date_range": "11-12.01.2027",
                        "month": 1,
                        "original_order": 0,
                    }
                ],
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            response["Content-Type"].startswith(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        )
        workbook = load_workbook(io.BytesIO(response.content), read_only=True)
        self.assertEqual(workbook["Schedule"]["A2"].value, "Auditor ISO 9001")
        self.assertEqual(workbook["Schedule"]["E2"].value, "11-12.01.2027")
        self.assertEqual(workbook["Holidays"]["A2"].value, "01.01.2027")
        workbook.close()
