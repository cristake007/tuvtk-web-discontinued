import base64
import binascii
from pathlib import Path

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from config.error_serializers import ApiErrorSerializer

from .files import MAX_COURSES
from .models import CoursePlanGeneration

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

WORD_MAX_UPLOAD_BYTES = 20 * 1024 * 1024
WORD_ALLOWED_EXTENSIONS = {".docx"}
MAX_WORD_BASE64_CHARS = 30 * 1024 * 1024
MAX_DECODED_WORD_BYTES = 20 * 1024 * 1024


class CoursePlannerSettingsSerializer(serializers.Serializer):
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    months = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=12),
        allow_empty=True,
        max_length=12,
    )
    randomness = serializers.IntegerField(min_value=1, max_value=10)
    xml_start_post_id = serializers.IntegerField(min_value=1, max_value=2_147_483_647)

    def validate_months(self, value):
        return list(dict.fromkeys(value))


class CoursePlannerHolidayQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(min_value=2024, max_value=2100)
    months = serializers.CharField(max_length=64)

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


class CoursePlannerHolidaySerializer(serializers.Serializer):
    date = serializers.CharField()
    name = serializers.CharField()
    source_label = serializers.CharField()


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


class FormatXmlRequestSerializer(serializers.Serializer):
    input_file = serializers.FileField()

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
    months = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=12),
        read_only=True,
    )
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


class WordMatchPreviewRequestSerializer(serializers.Serializer):
    word_file = serializers.FileField()
    schedule_file = serializers.FileField()

    def validate_word_file(self, value):
        extension = Path(value.name).suffix.casefold()
        if extension not in WORD_ALLOWED_EXTENSIONS:
            raise serializers.ValidationError("Fișierul Word trebuie să aibă formatul .docx.")
        if value.size <= 0:
            raise serializers.ValidationError("Fișierul Word este gol.")
        if value.size > WORD_MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("Fișierul Word trebuie să aibă cel mult 20 MB.")
        return value

    def validate_schedule_file(self, value):
        extension = Path(value.name).suffix.casefold()
        if extension not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
            raise serializers.ValidationError(
                f"Fișierul cu programul cursurilor trebuie să aibă unul dintre "
                f"formatele: {allowed}."
            )
        if value.size <= 0:
            raise serializers.ValidationError("Fișierul cu programul cursurilor este gol.")
        if value.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError(
                "Fișierul cu programul cursurilor trebuie să aibă cel mult 20 MB."
            )
        return value


class WordMatchCandidateSerializer(serializers.Serializer):
    row_index = serializers.IntegerField()
    title = serializers.CharField()
    dates = serializers.ListField(child=serializers.CharField(allow_blank=True))
    score = serializers.FloatField()
    word_coverage = serializers.FloatField()
    schedule_coverage = serializers.FloatField()
    exact = serializers.BooleanField()


class WordMatchRowSerializer(serializers.Serializer):
    word_row_index = serializers.IntegerField()
    word_title = serializers.CharField()
    selected_row_index = serializers.IntegerField(allow_null=True)
    status = serializers.ChoiceField(choices=["matched", "needs review"])
    candidates = WordMatchCandidateSerializer(many=True)


class WordMatchScheduleOptionSerializer(serializers.Serializer):
    row_index = serializers.IntegerField()
    title = serializers.CharField()
    dates = serializers.ListField(child=serializers.CharField(allow_blank=True))


class WordMatchPreviewResponseSerializer(serializers.Serializer):
    rows = WordMatchRowSerializer(many=True)
    schedule_options = WordMatchScheduleOptionSerializer(many=True)
    matched_count = serializers.IntegerField()
    skipped_count = serializers.IntegerField()
    word_file_b64 = serializers.CharField()


class WordMatchScheduleOptionInputSerializer(serializers.Serializer):
    row_index = serializers.IntegerField(min_value=0, max_value=1_000_000)
    title = serializers.CharField(max_length=1000, allow_blank=False)
    dates = serializers.ListField(
        child=serializers.CharField(allow_blank=True, max_length=50),
        max_length=3,
    )


class WordMatchAssignmentSerializer(serializers.Serializer):
    word_row_index = serializers.IntegerField(min_value=0, max_value=1_000_000)
    schedule_row_index = serializers.IntegerField(min_value=0, max_value=1_000_000)


class WordMatchGenerateRequestSerializer(serializers.Serializer):
    word_file_b64 = serializers.CharField(
        max_length=MAX_WORD_BASE64_CHARS,
        trim_whitespace=False,
    )
    schedule_options = WordMatchScheduleOptionInputSerializer(many=True)
    matches = WordMatchAssignmentSerializer(many=True, required=False, default=list)

    def validate_word_file_b64(self, value):
        try:
            decoded = base64.b64decode(value, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise serializers.ValidationError(
                "Datele fișierului Word sunt invalide. Reconstruiește previzualizarea."
            ) from exc
        if not decoded or len(decoded) > MAX_DECODED_WORD_BYTES:
            raise serializers.ValidationError("Datele fișierului Word au o dimensiune invalidă.")
        return decoded

    def validate_schedule_options(self, value):
        seen_indexes: set[int] = set()
        for option in value:
            if option["row_index"] in seen_indexes:
                raise serializers.ValidationError(
                    "Opțiunile din programul cursurilor conțin indici duplicați."
                )
            seen_indexes.add(option["row_index"])
        return value
