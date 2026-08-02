from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import PublicHoliday, PublicHolidaySettings
from .nager import NagerDateClient, NagerDateError, NagerHoliday
from .serializers import PublicHolidaySerializer
from .services import (
    get_holiday_dates,
    get_integration_settings,
    sync_public_holidays_if_due,
    synchronize_public_holidays_now,
    update_integration_settings,
)
from .tasks import sync_public_holidays_task


class PublicHolidayTaskTests(SimpleTestCase):
    def test_scheduled_sync_retries_transient_failures_with_backoff(self):
        self.assertEqual(sync_public_holidays_task.autoretry_for, (Exception,))
        self.assertTrue(sync_public_holidays_task.retry_backoff)
        self.assertEqual(sync_public_holidays_task.max_retries, 3)


class NagerDateClientTests(SimpleTestCase):
    def test_normalizes_localized_romanian_name(self):
        payload = [
            {
                "date": "2027-12-01",
                "localName": "Ziua Națională a României",
                "name": "National Day of Romania",
                "countryCode": "RO",
                "fixed": True,
                "global": True,
                "counties": None,
                "launchYear": 1990,
                "types": ["Public"],
            }
        ]

        holidays = NagerDateClient()._normalize_payload(payload, 2027)

        self.assertEqual(holidays[0].local_name, "Ziua Națională a României")
        self.assertEqual(holidays[0].english_name, "National Day of Romania")

    def test_rejects_payload_for_another_country(self):
        payload = [
            {
                "date": "2027-12-01",
                "localName": "Invalid",
                "name": "Invalid",
                "countryCode": "DE",
                "global": True,
                "counties": None,
                "types": ["Public"],
            }
        ]

        with self.assertRaises(NagerDateError):
            NagerDateClient()._normalize_payload(payload, 2027)


class PublicHolidaySynchronizationTests(TestCase):
    def setUp(self):
        self.settings = get_integration_settings()
        self.current_year = timezone.localdate().year
        PublicHoliday.objects.create(
            date=date(self.current_year, 7, 15),
            local_name="Zi liberă companie",
            description="Închidere internă",
            source=PublicHoliday.Source.INTERNAL,
            is_internal=True,
            country_code="RO",
            source_year=self.current_year,
            national_holiday=True,
            holiday_types=["Internal"],
        )

    @staticmethod
    def _holiday_for_year(year: int) -> NagerHoliday:
        return NagerHoliday(
            date=date(year, 12, 1),
            local_name="Ziua Națională a României",
            english_name="National Day of Romania",
            country_code="RO",
            national_holiday=True,
            subdivision_codes=(),
            holiday_types=("Public",),
        )

    def test_first_automatic_sync_is_due_after_settings_are_saved(self):
        frozen_now = timezone.now()

        with patch("apps.public_holidays.services.timezone.now", return_value=frozen_now):
            settings = update_integration_settings(
                enabled=True,
                automatic_sync=True,
                frequency=PublicHolidaySettings.Frequency.SIX_MONTHS,
            )

        self.assertEqual(settings.next_sync_at, frozen_now)

    @patch("apps.public_holidays.services.fetch_romanian_holidays")
    def test_manual_sync_preserves_internal_holidays(self, fetch_mock):
        fetch_mock.side_effect = lambda year: [self._holiday_for_year(year)]

        result = synchronize_public_holidays_now()

        self.assertEqual(result.status, "success")
        self.assertEqual(result.created, 2)
        self.assertTrue(
            PublicHoliday.objects.filter(
                source=PublicHoliday.Source.INTERNAL,
                local_name="Zi liberă companie",
            ).exists()
        )
        self.assertEqual(
            PublicHoliday.objects.filter(source=PublicHoliday.Source.NAGER).count(),
            2,
        )
        self.settings.refresh_from_db()
        self.assertEqual(
            self.settings.last_status,
            PublicHolidaySettings.SyncStatus.SUCCESS,
        )
        self.assertIsNotNone(self.settings.next_sync_at)

    @patch("apps.public_holidays.services.fetch_romanian_holidays")
    def test_automatic_sync_skips_when_not_due(self, fetch_mock):
        self.settings.next_sync_at = timezone.now() + timedelta(days=7)
        self.settings.save(update_fields=("next_sync_at", "updated_at"))

        result = sync_public_holidays_if_due()

        self.assertEqual(result.status, "skipped")
        fetch_mock.assert_not_called()

    def test_backend_calendar_returns_unique_dates(self):
        PublicHoliday.objects.create(
            date=date(self.current_year, 7, 15),
            local_name="A doua regulă internă",
            source=PublicHoliday.Source.INTERNAL,
            is_internal=True,
            country_code="RO",
            source_year=self.current_year,
            national_holiday=True,
            holiday_types=["Internal"],
        )

        dates = get_holiday_dates(year=self.current_year, months=[7])

        self.assertEqual(dates, [date(self.current_year, 7, 15)])

    def test_serializer_exposes_romanian_date_format(self):
        holiday = PublicHoliday.objects.get(source=PublicHoliday.Source.INTERNAL)

        data = PublicHolidaySerializer(holiday).data

        self.assertEqual(data["date"], holiday.date.strftime("%d.%m.%Y"))


class PublicHolidayApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_superuser(
            username="admin-holidays",
            email="admin-holidays@example.com",
            password="temporary-test-password",
        )
        self.client.force_authenticate(self.user)

    def test_staff_user_can_create_internal_holiday(self):
        response = self.client.post(
            reverse("api-v1:public-holidays:internal-create"),
            {
                "date": "01.12.2027",
                "local_name": "Zi internă test",
                "description": "Test",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["date"], "01.12.2027")
        self.assertTrue(response.data["is_internal"])

    def test_internal_holiday_validation_exposes_field_errors(self):
        response = self.client.post(
            reverse("api-v1:public-holidays:internal-create"),
            {
                "date": "data-invalida",
                "local_name": "Zi internă test",
                "description": "Test",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("date", payload["fields"])
        self.assertEqual(payload["detail"], payload["fields"]["date"][0])
