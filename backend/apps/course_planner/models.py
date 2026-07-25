import uuid
from datetime import date

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def current_year() -> int:
    return date.today().year


def course_plan_excel_path(instance, filename: str) -> str:
    return f"course-planner/{instance.pk}/planificare_cursuri_{instance.year}.xlsx"


def course_plan_word_path(instance, filename: str) -> str:
    return f"course-planner/{instance.pk}/planificare_cursuri_{instance.year}.docx"


def course_plan_xml_path(instance, filename: str) -> str:
    return f"course-planner/{instance.pk}/planificare_cursuri_{instance.year}.xml"


class CoursePlannerSettings(models.Model):
    year = models.PositiveSmallIntegerField(
        default=current_year,
        validators=[MinValueValidator(2024), MaxValueValidator(2100)],
    )
    months = models.JSONField(default=list, blank=True)
    randomness = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    holidays = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "setări planificator cursuri"
        verbose_name_plural = "setări planificator cursuri"
        permissions = [
            ("use_course_planner", "Can use the course planner"),
        ]

    def __str__(self) -> str:
        return f"Planificator cursuri {self.year}"


class CoursePlanGeneration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="course_plan_generations",
    )
    source_filename = models.CharField(max_length=255)
    year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2024), MaxValueValidator(2100)],
    )
    months = models.JSONField(default=list)
    randomness = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    holidays = models.JSONField(default=list, blank=True)
    course_count = models.PositiveIntegerField()
    schedule = models.JSONField(default=list)
    excel_file = models.FileField(
        upload_to=course_plan_excel_path,
        max_length=500,
    )
    word_file = models.FileField(
        upload_to=course_plan_word_path,
        max_length=500,
        blank=True,
    )
    xml_file = models.FileField(
        upload_to=course_plan_xml_path,
        max_length=500,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "generare planificare cursuri"
        verbose_name_plural = "generări planificare cursuri"
        indexes = [
            models.Index(fields=("-created_at",), name="course_plan_created_idx"),
            models.Index(fields=("year", "-created_at"), name="course_plan_year_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.source_filename} — {self.year}"
