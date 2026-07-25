from pathlib import Path

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from config.error_serializers import ApiErrorSerializer

from .files import MAX_COURSES
from .models import CoursePlanGeneration

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

    def validate_months(self, value):
        return list(dict.fromkeys(value))


class GenerateScheduleSerializer(serializers.Serializer):
    input_file = serializers.FileField()
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    months = serializers.CharField(max_length=64)
    randomness = serializers.IntegerField(min_value=1, max_value=10)

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


class ScheduledCourseSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=1000)
    permalink = serializers.CharField(max_length=2048, allow_blank=True)
    duration_label = serializers.CharField(max_length=100)
    investment = serializers.CharField(max_length=500, allow_blank=True)
    date_range = serializers.CharField(max_length=50)
    month = serializers.IntegerField(min_value=1, max_value=12)
    original_order = serializers.IntegerField(min_value=0, max_value=MAX_COURSES)


class CoursePlanFileSerializer(serializers.Serializer):
    available = serializers.BooleanField()
    filename = serializers.CharField(allow_null=True)


class CoursePlanFilesSerializer(serializers.Serializer):
    excel = CoursePlanFileSerializer()
    word = CoursePlanFileSerializer()
    xml = CoursePlanFileSerializer()


class CoursePlanGenerationSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    files = serializers.SerializerMethodField()

    class Meta:
        model = CoursePlanGeneration
        fields = (
            "id",
            "source_filename",
            "year",
            "months",
            "randomness",
            "course_count",
            "created_at",
            "created_by",
            "files",
        )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by(self, obj) -> str | None:
        if obj.created_by is None:
            return None
        return obj.created_by.get_full_name() or obj.created_by.get_username()

    @extend_schema_field(CoursePlanFilesSerializer)
    def get_files(self, obj) -> dict:
        def file_payload(field):
            return {
                "available": bool(field),
                "filename": Path(field.name).name if field else None,
            }

        return {
            "excel": file_payload(obj.excel_file),
            "word": file_payload(obj.word_file),
            "xml": file_payload(obj.xml_file),
        }


class CoursePlanHistoryResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = CoursePlanGenerationSerializer(many=True)


class GenerateScheduleResponseSerializer(serializers.Serializer):
    schedule = ScheduledCourseSerializer(many=True)
    course_count = serializers.IntegerField(min_value=0)
    generation = CoursePlanGenerationSerializer()


class ExportScheduleSerializer(serializers.Serializer):
    generation_id = serializers.UUIDField()


class UnscheduledCourseFieldsSerializer(serializers.Serializer):
    unscheduled_courses = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField())
    )


class UnscheduledCoursesSerializer(ApiErrorSerializer):
    fields = UnscheduledCourseFieldsSerializer()


class CoursePlannerErrorDetailSerializer(ApiErrorSerializer):
    pass
