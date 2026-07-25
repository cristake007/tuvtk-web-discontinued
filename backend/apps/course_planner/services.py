import random
from datetime import date, datetime
from pathlib import Path
from typing import Any, Sequence

from django.core.files.base import ContentFile
from django.db import transaction

from config.formats import ROMANIAN_DATE_FORMAT

from .files import CourseInput, create_excel_export
from .models import CoursePlanGeneration, CoursePlannerSettings
from .scheduler import CourseScheduler

MONTH_NAMES_RO = {
    1: "Ianuarie",
    2: "Februarie",
    3: "Martie",
    4: "Aprilie",
    5: "Mai",
    6: "Iunie",
    7: "Iulie",
    8: "August",
    9: "Septembrie",
    10: "Octombrie",
    11: "Noiembrie",
    12: "Decembrie",
}


class ScheduleGenerationError(ValueError):
    def __init__(self, unscheduled_courses: dict[int, list[str]]):
        self.unscheduled_courses = unscheduled_courses
        month_messages = [
            f"{MONTH_NAMES_RO[month]}: {', '.join(courses)}"
            for month, courses in unscheduled_courses.items()
        ]
        message = (
            "Nu toate cursurile pot fi planificate cu restricțiile actuale. "
            "Nu au fost găsite perioade pentru:\n" + "\n".join(month_messages)
        )
        super().__init__(message)


def parse_holidays(values: Sequence[str]) -> tuple[list[str], list[date]]:
    normalized: list[str] = []
    parsed_dates: list[date] = []

    for value in values:
        clean_value = value.strip()
        try:
            parsed = datetime.strptime(clean_value, ROMANIAN_DATE_FORMAT).date()
        except ValueError as exc:
            raise ValueError(
                f'Data „{clean_value}” trebuie să respecte formatul ZZ.LL.AAAA.'
            ) from exc
        canonical = parsed.strftime(ROMANIAN_DATE_FORMAT)
        if canonical not in normalized:
            normalized.append(canonical)
            parsed_dates.append(parsed)

    if len(normalized) > 366:
        raise ValueError("Pot fi configurate cel mult 366 de zile libere.")

    return normalized, parsed_dates


def get_course_planner_settings() -> CoursePlannerSettings:
    settings = CoursePlannerSettings.objects.order_by("pk").first()
    if settings is not None:
        return settings
    return CoursePlannerSettings.objects.create()


def update_course_planner_settings(
    *,
    year: int,
    months: list[int],
    randomness: int,
) -> CoursePlannerSettings:
    settings = get_course_planner_settings()
    settings.year = year
    settings.months = list(dict.fromkeys(months))
    settings.randomness = randomness
    settings.full_clean()
    settings.save()
    return settings


def serialize_settings(settings: CoursePlannerSettings) -> dict[str, Any]:
    return {
        "year": settings.year,
        "months": settings.months,
        "randomness": settings.randomness,
    }


def create_course_plan_generation(
    *,
    created_by,
    source_filename: str,
    year: int,
    months: Sequence[int],
    randomness: int,
    holidays: list[str],
    course_count: int,
    schedule: list[dict[str, Any]],
) -> CoursePlanGeneration:
    excel_data = create_excel_export(schedule, holidays)
    generation = CoursePlanGeneration(
        created_by=created_by,
        source_filename=Path(source_filename).name[:255],
        year=year,
        months=list(months),
        randomness=randomness,
        holidays=holidays,
        course_count=course_count,
        schedule=schedule,
    )
    filename = f"planificare_cursuri_{year}.xlsx"
    generation.excel_file.save(filename, ContentFile(excel_data), save=False)

    try:
        with transaction.atomic():
            generation.full_clean()
            generation.save()
    except Exception:
        if generation.excel_file.name:
            generation.excel_file.storage.delete(generation.excel_file.name)
        raise

    return generation


def generate_schedule(
    courses: Sequence[CourseInput],
    *,
    year: int,
    months: Sequence[int],
    holidays: list[date],
    randomness: int,
    random_source: random.Random | None = None,
) -> list[dict[str, Any]]:
    scheduler = CourseScheduler(year, holidays)
    randomizer = random_source or random.Random()
    schedule: list[dict[str, Any]] = []
    unscheduled_courses: dict[int, list[str]] = {}
    available_dates_cache: dict[tuple[int, int], tuple[date, ...]] = {}

    for month in months:
        scheduled_dates = set()
        month_unscheduled: set[str] = set()

        for course in courses:
            cache_key = (month, course.duration)
            if cache_key not in available_dates_cache:
                available_dates_cache[cache_key] = tuple(
                    scheduler.get_available_start_days(month, course.duration)
                )
            available_dates = available_dates_cache[cache_key]
            if not available_dates:
                month_unscheduled.add(course.title)
                continue

            minimum_gap = max(1, 11 - randomness)
            filtered_dates = [
                available_date
                for available_date in available_dates
                if not any(
                    abs((available_date - scheduled_date).days) < minimum_gap
                    for scheduled_date in scheduled_dates
                )
            ]
            dates_to_use = filtered_dates or available_dates

            if course.duration > 5:
                start_date = min(dates_to_use)
            elif randomness > 7:
                start_date = randomizer.choice(dates_to_use)
            else:
                count = len(dates_to_use)
                weights: list[float] = []
                for index in range(count):
                    if randomness <= 3:
                        weight = 0.5 if index < 5 else 1.0
                    elif randomness <= 6:
                        midpoint = count // 2
                        weight = 1.0 - (abs(index - midpoint) / count) * 0.5
                    else:
                        weight = 0.8 + randomizer.random() * 0.4
                    weights.append(weight)
                start_date = randomizer.choices(dates_to_use, weights=weights, k=1)[0]

            schedule.append(
                {
                    "title": course.title,
                    "permalink": course.permalink,
                    "duration_label": course.duration_label,
                    "investment": course.investment,
                    "date_range": scheduler.format_date_range(start_date, course.duration),
                    "month": month,
                    "original_order": course.original_order,
                }
            )
            scheduled_dates.add(start_date)

        if month_unscheduled:
            unscheduled_courses[month] = sorted(month_unscheduled)

    if unscheduled_courses:
        raise ScheduleGenerationError(unscheduled_courses)

    schedule.sort(key=lambda item: item["original_order"])
    return schedule
