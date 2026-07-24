from calendar import monthrange
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta

from django.db import DatabaseError, transaction
from django.db.models import Q, QuerySet
from django.utils import timezone

from .models import PublicHoliday, PublicHolidaySettings
from .nager import NagerDateError, NagerHoliday, fetch_romanian_holidays


@dataclass(frozen=True, slots=True)
class SynchronizationResult:
    status: str
    message: str
    accepted: int = 0
    created: int = 0
    updated: int = 0
    removed: int = 0

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def get_integration_settings() -> PublicHolidaySettings:
    settings, _ = PublicHolidaySettings.objects.get_or_create(pk=1)
    return settings


def _add_months(value: datetime, months: int) -> datetime:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def calculate_next_sync_at(
    value: datetime,
    frequency: str,
) -> datetime:
    months_by_frequency = {
        PublicHolidaySettings.Frequency.ONE_MONTH: 1,
        PublicHolidaySettings.Frequency.SIX_MONTHS: 6,
        PublicHolidaySettings.Frequency.ONE_YEAR: 12,
    }
    try:
        months = months_by_frequency[frequency]
    except KeyError as exc:
        raise ValueError("Frecvența de sincronizare nu este acceptată.") from exc
    return _add_months(value, months)


def update_integration_settings(
    *,
    enabled: bool,
    automatic_sync: bool,
    frequency: str,
) -> PublicHolidaySettings:
    settings = get_integration_settings()
    settings.enabled = enabled
    settings.automatic_sync = automatic_sync
    settings.frequency = frequency
    if enabled and automatic_sync:
        reference = settings.last_successful_at or timezone.now()
        settings.next_sync_at = calculate_next_sync_at(reference, frequency)
    else:
        settings.next_sync_at = None
    settings.save(
        update_fields=(
            "enabled",
            "automatic_sync",
            "frequency",
            "next_sync_at",
            "updated_at",
        )
    )
    return settings


def _acquire_sync_lock(now: datetime) -> bool:
    get_integration_settings()
    stale_before = now - timedelta(minutes=30)
    updated = (
        PublicHolidaySettings.objects.filter(pk=1)
        .filter(
            Q(sync_in_progress=False)
            | Q(sync_lock_acquired_at__isnull=True)
            | Q(sync_lock_acquired_at__lt=stale_before)
        )
        .update(sync_in_progress=True, sync_lock_acquired_at=now)
    )
    return updated == 1


def _release_sync_lock() -> None:
    PublicHolidaySettings.objects.filter(pk=1).update(
        sync_in_progress=False,
        sync_lock_acquired_at=None,
    )


def _record_skipped(message: str, now: datetime) -> SynchronizationResult:
    PublicHolidaySettings.objects.filter(pk=1).update(
        last_attempted_at=now,
        last_status=PublicHolidaySettings.SyncStatus.SKIPPED,
        last_error="",
    )
    return SynchronizationResult(status="skipped", message=message)


def _record_failure(message: str, now: datetime) -> SynchronizationResult:
    PublicHolidaySettings.objects.filter(pk=1).update(
        last_attempted_at=now,
        last_status=PublicHolidaySettings.SyncStatus.FAILED,
        last_error=message,
        last_accepted_count=0,
        last_created_count=0,
        last_updated_count=0,
        last_removed_count=0,
    )
    return SynchronizationResult(status="failed", message=message)


def _reconcile_holidays(
    holidays: list[NagerHoliday],
    years: list[int],
    synced_at: datetime,
) -> tuple[int, int, int]:
    existing = list(
        PublicHoliday.objects.filter(
            source=PublicHoliday.Source.NAGER,
            country_code="RO",
            source_year__in=years,
        )
    )
    existing_by_key = {(item.date, item.local_name): item for item in existing}
    created = 0
    updated = 0

    with transaction.atomic():
        for holiday in holidays:
            key = (holiday.date, holiday.local_name)
            stored = existing_by_key.pop(key, None)
            values = {
                "english_name": holiday.english_name,
                "description": "",
                "is_internal": False,
                "country_code": "RO",
                "source_year": holiday.date.year,
                "national_holiday": holiday.national_holiday,
                "subdivision_codes": list(holiday.subdivision_codes),
                "holiday_types": list(holiday.holiday_types),
            }
            if stored is None:
                PublicHoliday.objects.create(
                    date=holiday.date,
                    local_name=holiday.local_name,
                    source=PublicHoliday.Source.NAGER,
                    synced_at=synced_at,
                    **values,
                )
                created += 1
                continue

            changed = any(getattr(stored, field) != value for field, value in values.items())
            for field, value in values.items():
                setattr(stored, field, value)
            stored.synced_at = synced_at
            stored.save(update_fields=(*values.keys(), "synced_at", "updated_at"))
            if changed:
                updated += 1

        stale_ids = [item.pk for item in existing_by_key.values()]
        removed = len(stale_ids)
        if stale_ids:
            PublicHoliday.objects.filter(pk__in=stale_ids).delete()

    return created, updated, removed


def run_synchronization(*, automatic: bool) -> SynchronizationResult:
    now = timezone.now()
    if not _acquire_sync_lock(now):
        return SynchronizationResult(
            status="skipped",
            message="O sincronizare Nager.Date este deja în desfășurare.",
        )

    try:
        settings = get_integration_settings()
        if not settings.enabled:
            return _record_skipped("Integrarea Nager.Date este dezactivată.", now)
        if automatic and not settings.automatic_sync:
            return _record_skipped("Sincronizarea automată este dezactivată.", now)
        if automatic and settings.next_sync_at and settings.next_sync_at > now:
            return SynchronizationResult(
                status="skipped",
                message="Sincronizarea nu este încă scadentă.",
            )

        years = [now.year, now.year + 1]
        holidays: list[NagerHoliday] = []
        for year in years:
            holidays.extend(fetch_romanian_holidays(year))

        created, updated, removed = _reconcile_holidays(holidays, years, now)
        next_sync_at = (
            calculate_next_sync_at(now, settings.frequency)
            if settings.automatic_sync
            else None
        )
        PublicHolidaySettings.objects.filter(pk=1).update(
            last_attempted_at=now,
            last_successful_at=now,
            next_sync_at=next_sync_at,
            last_status=PublicHolidaySettings.SyncStatus.SUCCESS,
            last_error="",
            last_accepted_count=len(holidays),
            last_created_count=created,
            last_updated_count=updated,
            last_removed_count=removed,
        )
        return SynchronizationResult(
            status="success",
            message=(
                "Sincronizare finalizată: "
                f"{len(holidays)} acceptate, {created} create, "
                f"{updated} actualizate și {removed} eliminate."
            ),
            accepted=len(holidays),
            created=created,
            updated=updated,
            removed=removed,
        )
    except NagerDateError as exc:
        return _record_failure(str(exc), now)
    except (DatabaseError, OSError, ValueError):
        return _record_failure(
            "Sincronizarea nu a putut fi salvată; datele existente au fost păstrate.",
            now,
        )
    finally:
        _release_sync_lock()


def sync_public_holidays_if_due() -> SynchronizationResult:
    return run_synchronization(automatic=True)


def synchronize_public_holidays_now() -> SynchronizationResult:
    return run_synchronization(automatic=False)


def get_holidays(
    *,
    year: int,
    months: list[int] | None = None,
) -> QuerySet[PublicHoliday]:
    if year < 1 or year > 9998:
        raise ValueError("Anul trebuie să fie între 1 și 9998.")
    queryset = PublicHoliday.objects.filter(date__year=year)
    if months is not None:
        normalized = sorted(set(months))
        if not normalized or any(month < 1 or month > 12 for month in normalized):
            raise ValueError("Lunile trebuie să fie între 1 și 12.")
        queryset = queryset.filter(date__month__in=normalized)
    return queryset.order_by("date", "local_name")


def get_holiday_dates(*, year: int, months: list[int] | None = None) -> list[date]:
    return list(
        get_holidays(year=year, months=months)
        .values_list("date", flat=True)
        .distinct()
    )


def is_holiday(value: date) -> bool:
    return PublicHoliday.objects.filter(date=value).exists()
