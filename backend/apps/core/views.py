from uuid import uuid4

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ApplicationDefinition, NavigationItem
from .serializers import (
    ActualizareInterfataUtilizatorSerializer,
    CompanyLogoUploadSerializer,
    CoreBootstrapSerializer,
    ErrorDetailSerializer,
    NavigationItemSerializer,
    OrdineMeniuSerializer,
    PublicBrandingSerializer,
    ShellConfigurationSerializer,
    TitluSeparatorMeniuSerializer,
)
from .services import (
    get_active_configuration,
    get_core_bootstrap,
    get_or_create_active_configuration,
    serialize_shell_configuration,
)
from .svg import MAX_SVG_LOGO_BYTES, sanitize_svg_logo


class PublicBrandingView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="core_public_branding",
        responses=PublicBrandingSerializer,
        summary="Return public application branding",
        tags=["core"],
    )
    def get(self, request):
        configuration = serialize_shell_configuration(get_active_configuration())
        payload = {
            "site_name": configuration["site_name"],
            "organization_name": configuration["organization_name"],
            "logo_url": configuration["logo_url"],
            "culoare_primara": configuration["culoare_primara"],
            "culoare_accent": configuration["culoare_accent"],
            "culoare_fundal": configuration["culoare_fundal"],
            "culoare_titluri": configuration["culoare_titluri"],
            "font_scale": configuration["font_scale"],
        }
        return Response(PublicBrandingSerializer(payload).data)


class CoreBootstrapView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="core_bootstrap",
        responses=CoreBootstrapSerializer,
        summary="Return authentication state, shell configuration and navigation",
        tags=["core"],
    )
    def get(self, request):
        payload = get_core_bootstrap(request)
        return Response(CoreBootstrapSerializer(payload).data)


class CompanyLogoView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="core_company_logo",
        responses={
            (200, "image/svg+xml"): OpenApiTypes.BINARY,
            404: ErrorDetailSerializer,
        },
        summary="Return the configured company SVG logo",
        tags=["core"],
    )
    def get(self, request):
        configuration = get_active_configuration()
        if configuration is None or not configuration.company_logo_svg:
            return Response(
                {"detail": "No company logo is configured."},
                status=status.HTTP_404_NOT_FOUND,
            )

        response = HttpResponse(
            configuration.company_logo_svg,
            content_type="image/svg+xml; charset=utf-8",
        )
        response["Cache-Control"] = "public, max-age=31536000, immutable"
        response["Content-Disposition"] = 'inline; filename="company-logo.svg"'
        response["Content-Security-Policy"] = (
            "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response


class UserInterfaceAdministrationView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="core_administration_user_interface_read",
        responses={
            200: ShellConfigurationSerializer,
            403: ErrorDetailSerializer,
        },
        summary="Return user interface administration settings",
        tags=["administration"],
    )
    def get(self, request):
        configuration = get_or_create_active_configuration()
        payload = serialize_shell_configuration(configuration)
        return Response(ShellConfigurationSerializer(payload).data)

    @extend_schema(
        operation_id="core_administration_user_interface_update",
        request=ActualizareInterfataUtilizatorSerializer,
        responses={200: ShellConfigurationSerializer, 400: ErrorDetailSerializer},
        summary="Actualizează setările interfeței utilizator",
        tags=["administration"],
    )
    def patch(self, request):
        serializer = ActualizareInterfataUtilizatorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        configuration = get_or_create_active_configuration()
        for camp, valoare in serializer.validated_data.items():
            setattr(configuration, camp, valoare)
        configuration.save(update_fields=[*serializer.validated_data.keys(), "updated_at"])
        return Response(ShellConfigurationSerializer(serialize_shell_configuration(configuration)).data)


class UserInterfaceNavigationView(APIView):
    permission_classes = [IsAdminUser]
    serializer_class = NavigationItemSerializer

    def get_queryset(self):
        return NavigationItem.objects.filter(
            parent__isnull=True,
            is_enabled=True,
            application__is_enabled=True,
        ).select_related("application", "parent").order_by("position", "label")

    @staticmethod
    def serialize_navigation(items):
        return [
            {
                "key": item.key,
                "label": item.label,
                "path": item.path,
                "icon": item.icon,
                "position": item.position,
                "parent_key": item.parent.key if item.parent else None,
                "application_key": item.application.key,
                "is_separator": item.is_separator,
            }
            for item in items
        ]

    @extend_schema(
        operation_id="core_administration_user_interface_navigation_read",
        responses=NavigationItemSerializer(many=True),
        summary="Returnează elementele principale ale meniului",
        tags=["administration"],
    )
    def get(self, request):
        payload = self.serialize_navigation(self.get_queryset())
        return Response(NavigationItemSerializer(payload, many=True).data)

    @extend_schema(
        operation_id="core_administration_user_interface_navigation_separator_create",
        request=TitluSeparatorMeniuSerializer,
        responses={
            201: NavigationItemSerializer,
            400: ErrorDetailSerializer,
            403: ErrorDetailSerializer,
        },
        summary="Adaugă un separator în meniul principal",
        tags=["administration"],
    )
    def post(self, request):
        serializer = TitluSeparatorMeniuSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        aplicatie_core = ApplicationDefinition.objects.get(key="core")
        ultima_pozitie = (
            NavigationItem.objects.filter(parent__isnull=True)
            .order_by("-position")
            .values_list("position", flat=True)
            .first()
            or 0
        )
        separator = NavigationItem.objects.create(
            application=aplicatie_core,
            key=f"separator-{uuid4().hex[:12]}",
            label=serializer.validated_data["label"],
            path="",
            position=ultima_pozitie + 10,
            is_separator=True,
        )
        payload = self.serialize_navigation([separator])[0]
        return Response(NavigationItemSerializer(payload).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        operation_id="core_administration_user_interface_navigation_reorder",
        request=OrdineMeniuSerializer,
        responses={200: NavigationItemSerializer(many=True), 400: ErrorDetailSerializer},
        summary="Reordonează elementele principale ale meniului",
        tags=["administration"],
    )
    def put(self, request):
        serializer = OrdineMeniuSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = list(self.get_queryset())
        chei = serializer.validated_data["chei"]
        chei_curente = {item.key for item in items}

        if len(chei) != len(set(chei)) or set(chei) != chei_curente:
            return Response(
                {"detail": "Lista transmisă trebuie să conțină exact elementele meniului."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items_dupa_cheie = {item.key: item for item in items}
        with transaction.atomic():
            for index, cheie in enumerate(chei, start=1):
                item = items_dupa_cheie[cheie]
                item.position = index * 10
                item.save(update_fields=("position",))

        payload = self.serialize_navigation(self.get_queryset())
        return Response(NavigationItemSerializer(payload, many=True).data)


class UserInterfaceNavigationSeparatorView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="core_administration_user_interface_navigation_separator_update",
        request=TitluSeparatorMeniuSerializer,
        responses={
            200: NavigationItemSerializer,
            400: ErrorDetailSerializer,
            404: ErrorDetailSerializer,
        },
        summary="Redenumește un separator din meniul principal",
        tags=["administration"],
    )
    def patch(self, request, key):
        serializer = TitluSeparatorMeniuSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        separator = get_object_or_404(
            NavigationItem,
            key=key,
            parent__isnull=True,
            is_separator=True,
        )
        separator.label = serializer.validated_data["label"]
        separator.save(update_fields=("label",))
        payload = UserInterfaceNavigationView.serialize_navigation([separator])[0]
        return Response(NavigationItemSerializer(payload).data)

    @extend_schema(
        operation_id="core_administration_user_interface_navigation_separator_remove",
        responses={204: None, 404: ErrorDetailSerializer},
        summary="Elimină un separator din meniul principal",
        tags=["administration"],
    )
    def delete(self, request, key):
        separator = get_object_or_404(
            NavigationItem,
            key=key,
            parent__isnull=True,
            is_separator=True,
        )
        separator.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserInterfaceCompanyLogoView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="core_administration_user_interface_company_logo_upload",
        request=CompanyLogoUploadSerializer,
        responses={
            200: ShellConfigurationSerializer,
            400: ErrorDetailSerializer,
            403: ErrorDetailSerializer,
        },
        summary="Upload the company SVG logo for the user interface",
        tags=["administration"],
    )
    def post(self, request):
        serializer = CompanyLogoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logo = serializer.validated_data["logo"]

        if logo.size > MAX_SVG_LOGO_BYTES:
            return Response(
                {"detail": "The SVG file must be 256 KB or smaller."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            sanitized_svg = sanitize_svg_logo(logo.read())
        except DjangoValidationError as exc:
            message = exc.messages[0] if exc.messages else "The SVG logo is invalid."
            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        configuration = get_or_create_active_configuration()
        configuration.company_logo_svg = sanitized_svg
        configuration.save(update_fields=("company_logo_svg", "updated_at"))

        payload = serialize_shell_configuration(configuration)
        return Response(ShellConfigurationSerializer(payload).data)

    @extend_schema(
        operation_id="core_administration_user_interface_company_logo_remove",
        request=None,
        responses={204: None, 403: ErrorDetailSerializer},
        summary="Remove the company SVG logo from the user interface",
        tags=["administration"],
    )
    def delete(self, request):
        configuration = get_or_create_active_configuration()
        configuration.company_logo_svg = ""
        configuration.save(update_fields=("company_logo_svg", "updated_at"))
        return Response(status=status.HTTP_204_NO_CONTENT)
