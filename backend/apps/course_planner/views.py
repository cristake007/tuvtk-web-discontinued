from pathlib import Path

from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .files import CourseFileError, create_excel_export, parse_course_file
from .serializers import (
    CoursePlannerSettingsSerializer,
    ErrorDetailSerializer,
    ExportScheduleSerializer,
    GenerateScheduleResponseSerializer,
    GenerateScheduleSerializer,
    UnscheduledCoursesSerializer,
)
from .services import (
    ScheduleGenerationError,
    generate_schedule,
    get_course_planner_settings,
    parse_holidays,
    serialize_settings,
    update_course_planner_settings,
)


def _first_error(errors) -> str:
    if isinstance(errors, dict):
        for value in errors.values():
            return _first_error(value)
    if isinstance(errors, list) and errors:
        return _first_error(errors[0])
    return str(errors)


class CoursePlannerSettingsView(APIView):
    permission_classes = [IsAuthenticated]

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
        responses={200: CoursePlannerSettingsSerializer, 400: ErrorDetailSerializer},
        summary="Update course planner settings",
        tags=["course-planner"],
    )
    def put(self, request):
        serializer = CoursePlannerSettingsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": _first_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings = update_course_planner_settings(**serializer.validated_data)
        return Response(CoursePlannerSettingsSerializer(serialize_settings(settings)).data)


class GenerateScheduleView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="course_planner_generate",
        request=GenerateScheduleSerializer,
        responses={
            200: GenerateScheduleResponseSerializer,
            400: UnscheduledCoursesSerializer,
        },
        summary="Generate course periods from a CSV or Excel file",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = GenerateScheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": _first_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        values = serializer.validated_data
        upload = values["input_file"]
        extension = Path(upload.name).suffix.casefold()

        try:
            courses = parse_course_file(upload.read(), extension)
            normalized_holidays, parsed_holidays = parse_holidays(
                values.get("holidays", [])
            )
            schedule = generate_schedule(
                courses,
                year=values["year"],
                months=values["months"],
                holidays=parsed_holidays,
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

        update_course_planner_settings(
            year=values["year"],
            months=values["months"],
            randomness=values["randomness"],
            holidays=normalized_holidays,
        )
        payload = {
            "schedule": schedule,
            "course_count": len(courses),
        }
        return Response(GenerateScheduleResponseSerializer(payload).data)


class ExportScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="course_planner_export",
        request=ExportScheduleSerializer,
        responses={
            (200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"): OpenApiTypes.BINARY,
            400: ErrorDetailSerializer,
        },
        summary="Export the generated course schedule to Excel",
        tags=["course-planner"],
    )
    def post(self, request):
        serializer = ExportScheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": _first_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        values = serializer.validated_data
        try:
            excel_data = create_excel_export(values["schedule"], values["holidays"])
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
            f'attachment; filename="planificare_cursuri_{values["year"]}.xlsx"'
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response
