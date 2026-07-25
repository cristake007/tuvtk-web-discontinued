import apps.course_planner.models
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="CoursePlannerSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "year",
                    models.PositiveSmallIntegerField(
                        default=apps.course_planner.models.current_year,
                        validators=[
                            django.core.validators.MinValueValidator(2024),
                            django.core.validators.MaxValueValidator(2100),
                        ],
                    ),
                ),
                ("months", models.JSONField(blank=True, default=list)),
                (
                    "randomness",
                    models.PositiveSmallIntegerField(
                        default=5,
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(10),
                        ],
                    ),
                ),
                ("holidays", models.JSONField(blank=True, default=list)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "setări planificator cursuri",
                "verbose_name_plural": "setări planificator cursuri",
                "permissions": [
                    ("use_course_planner", "Can use the course planner"),
                ],
            },
        ),
    ]
