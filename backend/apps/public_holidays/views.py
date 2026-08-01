from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.error_serializers import first_serializer_error

from .models import PublicHoliday
from .serializers import (
    InternalHolidayWriteSerializer,
    PublicHolidayErrorDetailSerializer,
    PublicHolidaySerializer,
    PublicHolidaySettingsSerializer,
    PublicHolidaySettingsUpdateSerializer,
    SynchronizationResultSerializer,
)
from .services import (
    get_holidays,
    get_integration_settings,
    synchronize_public_holidays_now,
    update_integration_settings,
)


def _parse_year(value: str | None) -> int:
    if value is None:
        return timezone.localdate().year
    try:
        year = int(value)
    except ValueError as exc:
        raise ValueError("Anul trebuie să fie un număr întreg.") from exc
    if year < 1970 or year > 2100:
        raise ValueError("Anul trebuie să fie între 1970 și 2100.")
    return year


def _parse_months(value: str | None) -> list[int] | None:
    if value is None or not value.strip():
        return None
    try:
        months = [int(item.strip()) for item in value.split(",") if item.strip()]
    except ValueError as exc:
        raise ValueError("Lunile trebuie trimise ca numere separate prin virgulă.") from exc
    if not months or any(month < 1 or month > 12 for month in months):
        raise ValueError("Lunile trebuie să fie între 1 și 12.")
    return months


class PublicHolidayListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="public_holidays_list",
        parameters=[
            OpenApiParameter("year", OpenApiTypes.INT, required=False),
            OpenApiParameter(
                "months",
                OpenApiTypes.STR,
                required=False,
                description="Luni separate prin virgulă, de exemplu 1,2,12.",
            ),
        ],
        responses={
            200: PublicHolidaySerializer(many=True),
            400: PublicHolidayErrorDetailSerializer,
        },
        summary="Return stored Romanian public and internal holidays",
        tags=["public-holidays"],
    )
    def get(self, request):
        try:
            year = _parse_year(request.query_params.get("year"))
            months = _parse_months(request.query_params.get("months"))
            holidays = get_holidays(year=year, months=months)
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(PublicHolidaySerializer(holidays, many=True).data)


class PublicHolidaySettingsView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="public_holidays_settings_read",
        responses=PublicHolidaySettingsSerializer,
        summary="Return Nager.Date integration settings",
        tags=["public-holidays"],
    )
    def get(self, request):
        settings = get_integration_settings()
        return Response(PublicHolidaySettingsSerializer(settings).data)

    @extend_schema(
        operation_id="public_holidays_settings_update",
        request=PublicHolidaySettingsUpdateSerializer,
        responses={
            200: PublicHolidaySettingsSerializer,
            400: PublicHolidayErrorDetailSerializer,
        },
        summary="Update Nager.Date integration settings",
        tags=["public-holidays"],
    )
    def put(self, request):
        serializer = PublicHolidaySettingsUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        settings = update_integration_settings(**serializer.validated_data)
        return Response(PublicHolidaySettingsSerializer(settings).data)


class PublicHolidaySyncView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="public_holidays_sync_now",
        request=None,
        responses={
            200: SynchronizationResultSerializer,
            502: PublicHolidayErrorDetailSerializer,
        },
        summary="Synchronize Romanian holidays from Nager.Date now",
        tags=["public-holidays"],
    )
    def post(self, request):
        result = synchronize_public_holidays_now()
        if result.status == "failed":
            return Response(
                {"detail": result.message},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(SynchronizationResultSerializer(result.to_dict()).data)


class InternalHolidayCreateView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="internal_holiday_create",
        request=InternalHolidayWriteSerializer,
        responses={
            201: PublicHolidaySerializer,
            400: PublicHolidayErrorDetailSerializer,
        },
        summary="Create an internal non-working day",
        tags=["public-holidays"],
    )
    def post(self, request):
        serializer = InternalHolidayWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            holiday = serializer.save(
                source=PublicHoliday.Source.INTERNAL,
                is_internal=True,
                country_code="RO",
                source_year=serializer.validated_data["date"].year,
                national_holiday=True,
                subdivision_codes=[],
                holiday_types=["Internal"],
                created_by=request.user,
            )
        except IntegrityError:
            return Response(
                {"detail": "Această zi internă există deja."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            PublicHolidaySerializer(holiday).data,
            status=status.HTTP_201_CREATED,
        )


class InternalHolidayDetailView(APIView):
    permission_classes = [IsAdminUser]

    def _get_holiday(self, holiday_id):
        return get_object_or_404(
            PublicHoliday,
            pk=holiday_id,
            source=PublicHoliday.Source.INTERNAL,
            is_internal=True,
        )

    @extend_schema(
        operation_id="internal_holiday_update",
        request=InternalHolidayWriteSerializer,
        responses={
            200: PublicHolidaySerializer,
            400: PublicHolidayErrorDetailSerializer,
            404: PublicHolidayErrorDetailSerializer,
        },
        summary="Update an internal non-working day",
        tags=["public-holidays"],
    )
    def patch(self, request, holiday_id):
        holiday = self._get_holiday(holiday_id)
        serializer = InternalHolidayWriteSerializer(
            holiday,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(
                {"detail": first_serializer_error(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            updated = serializer.save(
                source_year=serializer.validated_data.get("date", holiday.date).year
            )
        except IntegrityError:
            return Response(
                {"detail": "Această zi internă există deja."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(PublicHolidaySerializer(updated).data)

    @extend_schema(
        operation_id="internal_holiday_delete",
        responses={204: None, 404: PublicHolidayErrorDetailSerializer},
        summary="Delete an internal non-working day",
        tags=["public-holidays"],
    )
    def delete(self, request, holiday_id):
        holiday = self._get_holiday(holiday_id)
        holiday.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
