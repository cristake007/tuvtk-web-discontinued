from datetime import date

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def current_year() -> int:
    return date.today().year


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
