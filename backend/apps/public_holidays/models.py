import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q


class PublicHoliday(models.Model):
    class Source(models.TextChoices):
        NAGER = "nager", "Nager.Date"
        INTERNAL = "internal", "Zi internă"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(db_index=True)
    local_name = models.CharField(max_length=255)
    english_name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=16, choices=Source.choices)
    is_internal = models.BooleanField(default=False)
    country_code = models.CharField(max_length=2, default="RO", editable=False)
    source_year = models.PositiveSmallIntegerField(null=True, blank=True)
    national_holiday = models.BooleanField(default=True)
    subdivision_codes = models.JSONField(default=list, blank=True)
    holiday_types = models.JSONField(default=list, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="internal_public_holidays",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("date", "local_name")
        verbose_name = "zi sărbătoare"
        verbose_name_plural = "zile sărbătoare"
        constraints = [
            models.UniqueConstraint(
                fields=("date", "local_name", "source"),
                name="public_holiday_source_identity_unique",
            ),
            models.CheckConstraint(
                condition=(
                    Q(source="internal", is_internal=True)
                    | Q(source="nager", is_internal=False)
                ),
                name="public_holiday_source_internal_consistent",
            ),
        ]
        indexes = [
            models.Index(
                fields=("source", "source_year", "date"),
                name="public_holiday_sync_scope_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.date:%d.%m.%Y} — {self.local_name}"


class PublicHolidaySettings(models.Model):
    class Frequency(models.TextChoices):
        ONE_MONTH = "1_month", "O lună"
        SIX_MONTHS = "6_months", "Șase luni"
        ONE_YEAR = "1_year", "Un an"

    class SyncStatus(models.TextChoices):
        NEVER = "never", "Niciodată"
        SUCCESS = "success", "Succes"
        SKIPPED = "skipped", "Omis"
        FAILED = "failed", "Eșuat"

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    enabled = models.BooleanField(default=True)
    automatic_sync = models.BooleanField(default=True)
    frequency = models.CharField(
        max_length=16,
        choices=Frequency.choices,
        default=Frequency.SIX_MONTHS,
    )
    last_attempted_at = models.DateTimeField(null=True, blank=True)
    last_successful_at = models.DateTimeField(null=True, blank=True)
    next_sync_at = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(
        max_length=16,
        choices=SyncStatus.choices,
        default=SyncStatus.NEVER,
    )
    last_error = models.TextField(blank=True)
    last_accepted_count = models.PositiveIntegerField(default=0)
    last_created_count = models.PositiveIntegerField(default=0)
    last_updated_count = models.PositiveIntegerField(default=0)
    last_removed_count = models.PositiveIntegerField(default=0)
    sync_in_progress = models.BooleanField(default=False)
    sync_lock_acquired_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "setări integrare zile sărbătoare"
        verbose_name_plural = "setări integrare zile sărbătoare"

    def __str__(self) -> str:
        return "Integrare Nager.Date România"
