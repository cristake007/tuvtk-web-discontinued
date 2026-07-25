from django.http import HttpRequest

from apps.authentication.services import serialize_session_user

from .models import ApplicationConfiguration, NavigationItem

DEFAULT_CONFIGURATION = {
    "site_name": "TUVTK",
    "organization_name": "TÜV Thüringen Karpat",
    "sidebar_title": "Workspace",
    "logo_url": None,
}


def get_active_configuration() -> ApplicationConfiguration | None:
    return (
        ApplicationConfiguration.objects.filter(is_active=True)
        .order_by("pk")
        .first()
    )


def get_or_create_active_configuration() -> ApplicationConfiguration:
    configuration = get_active_configuration()
    if configuration is not None:
        return configuration

    return ApplicationConfiguration.objects.create(
        site_name=DEFAULT_CONFIGURATION["site_name"],
        organization_name=DEFAULT_CONFIGURATION["organization_name"],
        sidebar_title=DEFAULT_CONFIGURATION["sidebar_title"],
        is_active=True,
    )


def serialize_shell_configuration(
    configuration: ApplicationConfiguration | None,
) -> dict[str, object]:
    if configuration is None:
        return DEFAULT_CONFIGURATION.copy()

    logo_url = None
    if configuration.company_logo_svg:
        version = configuration.updated_at.strftime("%Y%m%d%H%M%S%f")
        logo_url = f"/api/v1/core/company-logo?v={version}"

    return {
        "site_name": configuration.site_name,
        "organization_name": configuration.organization_name,
        "sidebar_title": configuration.sidebar_title,
        "logo_url": logo_url,
    }


def get_core_bootstrap(request: HttpRequest) -> dict[str, object]:
    configuration_payload = serialize_shell_configuration(get_active_configuration())

    user = request.user
    navigation_payload: list[dict[str, object]] = []

    items = (
        NavigationItem.objects.filter(
            is_enabled=True,
            application__is_enabled=True,
        )
        .select_related("application", "parent")
    )

    for item in items:
        if item.requires_staff and not user.is_staff:
            continue

        if item.permission_code and not user.has_perm(item.permission_code):
            continue

        navigation_payload.append(
            {
                "key": item.key,
                "label": item.label,
                "path": item.path,
                "icon": item.icon,
                "position": item.position,
                "parent_key": item.parent.key if item.parent else None,
                "application_key": item.application.key,
            }
        )

    return {
        "configuration": configuration_payload,
        "user": serialize_session_user(user),
        "navigation": navigation_payload,
    }
