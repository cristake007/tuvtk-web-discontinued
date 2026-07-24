import re
from pathlib import Path

from rest_framework import serializers

from .files import MAX_COURSES
from .services import parse_holidays

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


class CoursePlannerSettingsSerializer(serializers.Serializer):
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    months = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=12),
        allow_empty=True,
        max_length=12,
    )
    randomness = serializers.IntegerField(min_value=1, max_value=10)
    holidays = serializers.ListField(
        child=serializers.CharField(max_length=10),
        allow_empty=True,
        max_length=366,
    )

    def validate_months(self, value):
        return list(dict.fromkeys(value))

    def validate_holidays(self, value):
        try:
            normalized, _ = parse_holidays(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return normalized


class GenerateScheduleSerializer(serializers.Serializer):
    input_file = serializers.FileField()
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    months = serializers.CharField(max_length=64)
    randomness = serializers.IntegerField(min_value=1, max_value=10)
    holidays = serializers.CharField(allow_blank=True, required=False)

    def validate_input_file(self, value):
        extension = Path(value.name).suffix.casefold()
        if extension not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
            raise serializers.ValidationError(
                f"Fișierul trebuie să aibă unul dintre formatele: {allowed}."
            )
        if value.size <= 0:
            raise serializers.ValidationError("Fișierul este gol.")
        if value.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("Fișierul trebuie să aibă cel mult 20 MB.")
        return value

    def validate_months(self, value):
        try:
            months = [int(item.strip()) for item in value.split(",") if item.strip()]
        except ValueError as exc:
            raise serializers.ValidationError("Lunile selectate nu sunt valide.") from exc
        months = list(dict.fromkeys(months))
        if not months:
            raise serializers.ValidationError("Selectează cel puțin o lună.")
        if len(months) > 12 or any(month < 1 or month > 12 for month in months):
            raise serializers.ValidationError("Lunile trebuie să fie între 1 și 12.")
        return months

    def validate_holidays(self, value):
        raw_values = [item.strip() for item in re.split(r"[\n,;]+", value) if item.strip()]
        try:
            normalized, _ = parse_holidays(raw_values)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return normalized


class ScheduledCourseSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=1000)
    permalink = serializers.CharField(max_length=2048, allow_blank=True)
    duration_label = serializers.CharField(max_length=100)
    investment = serializers.CharField(max_length=500, allow_blank=True)
    date_range = serializers.CharField(max_length=50)
    month = serializers.IntegerField(min_value=1, max_value=12)
    original_order = serializers.IntegerField(min_value=0, max_value=MAX_COURSES)


class GenerateScheduleResponseSerializer(serializers.Serializer):
    schedule = ScheduledCourseSerializer(many=True)
    course_count = serializers.IntegerField(min_value=0)


class ExportScheduleSerializer(serializers.Serializer):
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    holidays = serializers.ListField(
        child=serializers.CharField(max_length=10),
        allow_empty=True,
        max_length=366,
    )
    schedule = ScheduledCourseSerializer(many=True, allow_empty=False)

    def validate_holidays(self, value):
        try:
            normalized, _ = parse_holidays(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        return normalized


class UnscheduledCoursesSerializer(serializers.Serializer):
    detail = serializers.CharField()
    unscheduled_courses = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField())
    )


class CoursePlannerErrorDetailSerializer(serializers.Serializer):
    detail = serializers.CharField()
