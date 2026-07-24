from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from ninja import File, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from ninja.security import django_auth

from .schemas import CoreBootstrapSchema, ShellConfigurationSchema
from .services import (
    get_active_configuration,
    get_core_bootstrap,
    get_or_create_active_configuration,
    serialize_shell_configuration,
)
from .svg import sanitize_svg_logo


router = Router(tags=["core"])


def require_staff(request: HttpRequest) -> None:
    if not request.user.is_staff:
        raise HttpError(403, "Administrator access is required.")


@router.get(
    "/bootstrap",
    auth=django_auth,
    response=CoreBootstrapSchema,
    summary="Return application shell configuration and navigation",
)
def core_bootstrap(request: HttpRequest) -> dict[str, object]:
    return get_core_bootstrap(request)


@router.get(
    "/company-logo",
    auth=django_auth,
    include_in_schema=False,
)
def company_logo(request: HttpRequest) -> HttpResponse:
    configuration = get_active_configuration()
    if configuration is None or not configuration.company_logo_svg:
        raise HttpError(404, "No company logo is configured.")

    response = HttpResponse(
        configuration.company_logo_svg,
        content_type="image/svg+xml; charset=utf-8",
    )
    response["Cache-Control"] = "private, max-age=31536000, immutable"
    response["Content-Disposition"] = 'inline; filename="company-logo.svg"'
    response["Content-Security-Policy"] = (
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
    )
    response["X-Content-Type-Options"] = "nosniff"
    return response


@router.post(
    "/settings/company-logo",
    auth=django_auth,
    response=ShellConfigurationSchema,
    summary="Upload the company SVG logo",
)
def upload_company_logo(
    request: HttpRequest,
    logo: File[UploadedFile],
) -> dict[str, object]:
    require_staff(request)

    try:
        sanitized_svg = sanitize_svg_logo(logo.read())
    except ValidationError as exc:
        message = exc.messages[0] if exc.messages else "The SVG logo is invalid."
        raise HttpError(400, message) from exc

    configuration = get_or_create_active_configuration()
    configuration.company_logo_svg = sanitized_svg
    configuration.save(update_fields=("company_logo_svg", "updated_at"))
    return serialize_shell_configuration(configuration)


@router.delete(
    "/settings/company-logo",
    auth=django_auth,
    response={204: None},
    summary="Remove the company SVG logo",
)
def remove_company_logo(request: HttpRequest) -> tuple[int, None]:
    require_staff(request)

    configuration = get_or_create_active_configuration()
    configuration.company_logo_svg = ""
    configuration.save(update_fields=("company_logo_svg", "updated_at"))
    return 204, None
