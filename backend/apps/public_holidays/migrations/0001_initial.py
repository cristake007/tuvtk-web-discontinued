import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_integration_settings(apps, schema_editor):
    PublicHolidaySettings = apps.get_model(
        "public_holidays",
        "PublicHolidaySettings",
    )
    PublicHolidaySettings.objects.get_or_create(pk=1)


def remove_integration_settings(apps, schema_editor):
    PublicHolidaySettings = apps.get_model(
        "public_holidays",
        "PublicHolidaySettings",
    )
    PublicHolidaySettings.objects.filter(pk=1).delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PublicHolidaySettings",
            fields=[
                (
                    "id",
                    models.PositiveSmallIntegerField(
                        default=1,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("enabled", models.BooleanField(default=True)),
                ("automatic_sync", models.BooleanField(default=True)),
                (
                    "frequency",
                    models.CharField(
                        choices=[
                            ("1_month", "O lună"),
                            ("6_months", "Șase luni"),
                            ("1_year", "Un an"),
                        ],
                        default="6_months",
                        max_length=16,
                    ),
                ),
                ("last_attempted_at", models.DateTimeField(blank=True, null=True)),
                ("last_successful_at", models.DateTimeField(blank=True, null=True)),
                ("next_sync_at", models.DateTimeField(blank=True, null=True)),
                (
                    "last_status",
                    models.CharField(
                        choices=[
                            ("never", "Niciodată"),
                            ("success", "Succes"),
                            ("skipped", "Omis"),
                            ("failed", "Eșuat"),
                        ],
                        default="never",
                        max_length=16,
                    ),
                ),
                ("last_error", models.TextField(blank=True)),
                ("last_accepted_count", models.PositiveIntegerField(default=0)),
                ("last_created_count", models.PositiveIntegerField(default=0)),
                ("last_updated_count", models.PositiveIntegerField(default=0)),
                ("last_removed_count", models.PositiveIntegerField(default=0)),
                ("sync_in_progress", models.BooleanField(default=False)),
                ("sync_lock_acquired_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "setări integrare zile sărbătoare",
                "verbose_name_plural": "setări integrare zile sărbătoare",
            },
        ),
        migrations.CreateModel(
            name="PublicHoliday",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("date", models.DateField(db_index=True)),
                ("local_name", models.CharField(max_length=255)),
                ("english_name", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("nager", "Nager.Date"),
                            ("internal", "Zi internă"),
                        ],
                        max_length=16,
                    ),
                ),
                ("is_internal", models.BooleanField(default=False)),
                (
                    "country_code",
                    models.CharField(default="RO", editable=False, max_length=2),
                ),
                ("source_year", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("national_holiday", models.BooleanField(default=True)),
                ("subdivision_codes", models.JSONField(blank=True, default=list)),
                ("holiday_types", models.JSONField(blank=True, default=list)),
                ("synced_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="internal_public_holidays",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "zi sărbătoare",
                "verbose_name_plural": "zile sărbătoare",
                "ordering": ("date", "local_name"),
                "indexes": [
                    models.Index(
                        fields=["source", "source_year", "date"],
                        name="public_holiday_sync_scope_idx",
                    )
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("date", "local_name", "source"),
                        name="public_holiday_source_identity_unique",
                    ),
                    models.CheckConstraint(
                        condition=(
                            models.Q(source="internal", is_internal=True)
                            | models.Q(source="nager", is_internal=False)
                        ),
                        name="public_holiday_source_internal_consistent",
                    ),
                ],
            },
        ),
        migrations.RunPython(
            seed_integration_settings,
            remove_integration_settings,
        ),
    ]
