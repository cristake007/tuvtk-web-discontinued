from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CompanyLogoUploadSerializer,
    CoreBootstrapSerializer,
    ErrorDetailSerializer,
    PublicBrandingSerializer,
    ShellConfigurationSerializer,
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
