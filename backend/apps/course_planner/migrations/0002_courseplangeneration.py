import uuid

import apps.course_planner.models
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("course_planner", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CoursePlanGeneration",
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
                ("source_filename", models.CharField(max_length=255)),
                (
                    "year",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(2024),
                            django.core.validators.MaxValueValidator(2100),
                        ]
                    ),
                ),
                ("months", models.JSONField(default=list)),
                (
                    "randomness",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ]
                    ),
                ),
                ("holidays", models.JSONField(blank=True, default=list)),
                ("course_count", models.PositiveIntegerField()),
                ("schedule", models.JSONField(default=list)),
                (
                    "excel_file",
                    models.FileField(
                        max_length=500,
                        upload_to=apps.course_planner.models.course_plan_excel_path,
                    ),
                ),
                (
                    "word_file",
                    models.FileField(
                        blank=True,
                        max_length=500,
                        upload_to=apps.course_planner.models.course_plan_word_path,
                    ),
                ),
                (
                    "xml_file",
                    models.FileField(
                        blank=True,
                        max_length=500,
                        upload_to=apps.course_planner.models.course_plan_xml_path,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="course_plan_generations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "generare planificare cursuri",
                "verbose_name_plural": "generări planificare cursuri",
                "ordering": ("-created_at",),
                "indexes": [
                    models.Index(
                        fields=["-created_at"],
                        name="course_plan_created_idx",
                    ),
                    models.Index(
                        fields=["year", "-created_at"],
                        name="course_plan_year_idx",
                    ),
                ],
            },
        ),
    ]
