from pathlib import Path

from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.public_holidays.calendar import get_holiday_dates
from config.error_serializers import first_serializer_error
from config.formats import ROMANIAN_DATE_FORMAT

from .files import CourseFileError, create_excel_export, parse_course_file
from .models import CoursePlanGeneration
from .permissions import CanUseCoursePlanner
from .serializers import (
    CoursePlanGenerationSerializer,
    CoursePlanHistoryResponseSerializer,
    CoursePlannerErrorDetailSerializer,
    CoursePlannerHolidayQuerySerializer,
    CoursePlannerHolidaySerializer,
    CoursePlannerSettingsSerializer,
    ExportScheduleSerializer,
    GenerateScheduleResponseSerializer,
    GenerateScheduleSerializer,
    UnscheduledCoursesSerializer,
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


class CoursePlanHistoryPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class CoursePlannerSettingsView(APIView):
    permission_classes = [CanUseCoursePlanner]

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
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings = update_course_planner_settings(**serializer.validated_data)
        return Response(CoursePlannerSettingsSerializer(serialize_settings(settings)).data)


class CoursePlannerHolidaysView(APIView):
    permission_classes = [CanUseCoursePlanner]

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
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        values = serializer.validated_data
        holidays = get_course_planner_holidays(
            year=values["year"],
            months=values["months"],
        )
        return Response(CoursePlannerHolidaySerializer(holidays, many=True).data)


class GenerateScheduleView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [CanUseCoursePlanner]

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
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
    permission_classes = [CanUseCoursePlanner]

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
    permission_classes = [CanUseCoursePlanner]

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
    permission_classes = [CanUseCoursePlanner]

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
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
