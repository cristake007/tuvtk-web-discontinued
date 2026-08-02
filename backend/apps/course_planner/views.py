import base64
from pathlib import Path

from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasApplicationAccess
from apps.public_holidays.calendar import get_holiday_dates
from config.formats import ROMANIAN_DATE_FORMAT

from .files import (
    CourseFileError,
    create_excel_export,
    create_xml_export,
    parse_course_file,
    parse_xml_events,
)
from .models import CoursePlanGeneration
from .serializers import (
    CoursePlanGenerationSerializer,
    CoursePlanHistoryResponseSerializer,
    CoursePlannerErrorDetailSerializer,
    CoursePlannerHolidayQuerySerializer,
    CoursePlannerHolidaySerializer,
    CoursePlannerSettingsSerializer,
    ExportScheduleSerializer,
    FormatXmlRequestSerializer,
    GenerateScheduleResponseSerializer,
    GenerateScheduleSerializer,
    UnscheduledCoursesSerializer,
    WordMatchGenerateRequestSerializer,
    WordMatchPreviewRequestSerializer,
    WordMatchPreviewResponseSerializer,
)
from .services import (
    ScheduleGenerationError,
    create_course_plan_generation,
    generate_schedule,
    get_course_planner_holidays,
    get_course_planner_settings,
    serialize_settings,
    update_course_planner_settings,
)
from .word_matching import (
    ScheduleRow,
    apply_word_matches,
    build_word_match_preview,
    normalize_title,
    parse_schedule_file,
)


class CoursePlanHistoryPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class CoursePlannerSettingsView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_settings_read",
        responses=CoursePlannerSettingsSerializer,
        summary="Return course planner settings",
        tags=["course-planner"],
    )
    def get(self, request):
        payload = serialize_settings(get_course_planner_settings())
        return Response(CoursePlannerSettingsSerializer(payload).data)

    @extend_schema(
        operation_id="course_planner_settings_update",
        request=CoursePlannerSettingsSerializer,
        responses={
            200: CoursePlannerSettingsSerializer,
            400: CoursePlannerErrorDetailSerializer,
        },
        summary="Update course planner settings",
        tags=["course-planner"],
    )
    def put(self, request):
        serializer = CoursePlannerSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        settings = update_course_planner_settings(**serializer.validated_data)
        return Response(CoursePlannerSettingsSerializer(serialize_settings(settings)).data)


class CoursePlannerHolidaysView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_holidays_list",
        parameters=[CoursePlannerHolidayQuerySerializer],
        responses={
            200: CoursePlannerHolidaySerializer(many=True),
            400: CoursePlannerErrorDetailSerializer,
        },
        summary="List holidays used by the course planner",
        tags=["course-planner"],
    )
    def get(self, request):
        serializer = CoursePlannerHolidayQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        holidays = get_course_planner_holidays(
            year=values["year"],
            months=values["months"],
        )
        return Response(CoursePlannerHolidaySerializer(holidays, many=True).data)


class GenerateScheduleView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_generate",
        request=GenerateScheduleSerializer,
        responses={
            200: GenerateScheduleResponseSerializer,
            400: UnscheduledCoursesSerializer,
            500: CoursePlannerErrorDetailSerializer,
        },
        summary="Generate and persist course periods from a CSV or Excel file",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = GenerateScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        upload = values["input_file"]
        extension = Path(upload.name).suffix.casefold()

        try:
            courses = parse_course_file(upload.read(), extension)
            holiday_dates = get_holiday_dates(
                year=values["year"],
                months=values["months"],
            )
            normalized_holidays = [
                value.strftime(ROMANIAN_DATE_FORMAT) for value in holiday_dates
            ]
            schedule = generate_schedule(
                courses,
                year=values["year"],
                months=values["months"],
                holidays=holiday_dates,
                randomness=values["randomness"],
            )
        except CourseFileError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ScheduleGenerationError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "unscheduled_courses": exc.unscheduled_courses,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            generation = create_course_plan_generation(
                created_by=request.user,
                source_filename=upload.name,
                year=values["year"],
                months=values["months"],
                randomness=values["randomness"],
                holidays=normalized_holidays,
                course_count=len(courses),
                schedule=schedule,
            )
        except (KeyError, OSError, TypeError, ValueError):
            return Response(
                {"detail": "Planificarea nu a putut fi salvată în istoric."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        update_course_planner_settings(
            year=values["year"],
            months=values["months"],
            randomness=values["randomness"],
        )
        payload = {
            "schedule": schedule,
            "course_count": len(courses),
            "generation": generation,
        }
        return Response(GenerateScheduleResponseSerializer(payload).data)


class CoursePlanHistoryView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_history_list",
        responses=CoursePlanHistoryResponseSerializer,
        summary="List saved course plan generations",
        tags=["course-planner"],
    )
    def get(self, request):
        queryset = CoursePlanGeneration.objects.select_related("created_by").all()
        paginator = CoursePlanHistoryPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = CoursePlanGenerationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CoursePlanFileDownloadView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    file_types = {
        "excel": (
            "excel_file",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ),
        "word": (
            "word_file",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
        "xml": ("xml_file", "application/xml"),
    }

    @extend_schema(
        operation_id="course_planner_history_file_download",
        responses={
            200: OpenApiTypes.BINARY,
            404: CoursePlannerErrorDetailSerializer,
        },
        summary="Download a generated course plan artifact",
        tags=["course-planner"],
    )
    def get(self, request, generation_id, file_type):
        file_config = self.file_types.get(file_type)
        if file_config is None:
            return Response(
                {"detail": "Tipul de fișier solicitat nu este acceptat."},
                status=status.HTTP_404_NOT_FOUND,
            )

        generation = get_object_or_404(CoursePlanGeneration, pk=generation_id)
        field_name, content_type = file_config
        file_field = getattr(generation, field_name)
        if not file_field:
            return Response(
                {"detail": "Fișierul solicitat nu este disponibil pentru această generare."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = file_field.open("rb")
        except (FileNotFoundError, OSError):
            return Response(
                {"detail": "Fișierul nu mai există în spațiul de stocare."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=Path(file_field.name).name,
            content_type=content_type,
        )


class ExportScheduleView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_export",
        request=ExportScheduleSerializer,
        responses={
            (
                200,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ): OpenApiTypes.BINARY,
            400: CoursePlannerErrorDetailSerializer,
            404: CoursePlannerErrorDetailSerializer,
        },
        summary="Export a saved course plan generation to Excel",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = ExportScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        generation = get_object_or_404(
            CoursePlanGeneration,
            pk=serializer.validated_data["generation_id"],
        )
        try:
            excel_data = create_excel_export(generation.schedule, generation.holidays)
        except (KeyError, OSError, TypeError, ValueError):
            return Response(
                {"detail": "Fișierul Excel nu a putut fi generat."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = HttpResponse(
            excel_data,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="planificare_cursuri_{generation.year}.xlsx"'
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response


class FormatXmlView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_format_xml",
        request=FormatXmlRequestSerializer,
        responses={
            (200, "application/xml"): OpenApiTypes.BINARY,
            400: CoursePlannerErrorDetailSerializer,
        },
        summary="Convert a course schedule file into a WordPress import XML",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = FormatXmlRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["input_file"]
        extension = Path(upload.name).suffix.casefold()
        xml_start_post_id = get_course_planner_settings().xml_start_post_id

        try:
            events = parse_xml_events(upload.read(), extension)
            xml_content = create_xml_export(events, xml_start_post_id)
        except CourseFileError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        year = timezone.localdate().year
        response = HttpResponse(
            xml_content.encode("utf-8"),
            content_type="application/xml",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="formatted_courses_{year}.xml"'
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response


class WordMatchPreviewView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_word_match_preview",
        request=WordMatchPreviewRequestSerializer,
        responses={
            200: WordMatchPreviewResponseSerializer,
            400: CoursePlannerErrorDetailSerializer,
        },
        summary="Preview matches between a Word document and a course schedule file",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = WordMatchPreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        word_upload = serializer.validated_data["word_file"]
        schedule_upload = serializer.validated_data["schedule_file"]
        schedule_extension = Path(schedule_upload.name).suffix.casefold()

        try:
            word_file_bytes = word_upload.read()
            schedule_rows = parse_schedule_file(schedule_upload.read(), schedule_extension)
            preview = build_word_match_preview(word_file_bytes, schedule_rows)
        except CourseFileError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        preview["word_file_b64"] = base64.b64encode(word_file_bytes).decode("ascii")
        return Response(WordMatchPreviewResponseSerializer(preview).data)


class WordMatchGenerateView(APIView):
    application_key = "planificator-cursuri"
    permission_classes = [HasApplicationAccess]

    @extend_schema(
        operation_id="course_planner_word_match_generate",
        request=WordMatchGenerateRequestSerializer,
        responses={
            (
                200,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ): OpenApiTypes.BINARY,
            400: CoursePlannerErrorDetailSerializer,
        },
        summary="Apply confirmed matches and generate the updated Word document",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = WordMatchGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        schedule_rows = [
            ScheduleRow(
                row_index=option["row_index"],
                title=option["title"],
                normalized_title=normalize_title(option["title"]),
                dates=tuple((option["dates"] + ["", "", ""])[:3]),
            )
            for option in values["schedule_options"]
        ]
        matches = {
            item["word_row_index"]: item["schedule_row_index"] for item in values["matches"]
        }

        try:
            output_bytes, _matched_count, _skipped_count = apply_word_matches(
                values["word_file_b64"],
                schedule_rows,
                matches,
            )
        except CourseFileError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = HttpResponse(
            output_bytes,
            content_type=(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ),
        )
        response["Content-Disposition"] = 'attachment; filename="matched_courses.docx"'
        response["X-Content-Type-Options"] = "nosniff"
        return response
