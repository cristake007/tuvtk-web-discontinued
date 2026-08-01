from django.db.models import Q
from django.http import HttpRequest

from apps.authentication.services import serialize_session_user

from .models import ApplicationConfiguration, ApplicationDefinition, NavigationItem

DEFAULT_CONFIGURATION = {
    "site_name": "TUVTK",
    "organization_name": "TÜV Thüringen Karpat",
    "sidebar_title": "Workspace",
    "logo_url": None,
    "culoare_primara": "#164194",
    "culoare_accent": "#d41131",
    "culoare_fundal": "#ffffff",
    "culoare_titluri": "#1b2230",
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
        "culoare_primara": configuration.culoare_primara,
        "culoare_accent": configuration.culoare_accent,
        "culoare_fundal": configuration.culoare_fundal,
        "culoare_titluri": configuration.culoare_titluri,
    }


def user_has_application_access(user, application_key: str) -> bool:
    if not user or not user.is_authenticated or not user.is_active:
        return False

    application = (
        ApplicationDefinition.objects.filter(key=application_key, is_enabled=True)
        .only("id", "is_access_controlled")
        .first()
    )
    if application is None:
        return False
    if user.is_superuser:
        return True
    if not application.is_access_controlled:
        return True
    return application.allowed_groups.filter(user=user).exists() or application.allowed_users.filter(
        pk=user.pk
    ).exists()


def get_user_accessible_application_keys(user) -> set[str]:
    if not user or not user.is_authenticated or not user.is_active:
        return set()

    if user.is_superuser:
        return set(
            ApplicationDefinition.objects.filter(is_enabled=True).values_list(
                "key", flat=True
            )
        )
    applications = ApplicationDefinition.objects.filter(
        is_enabled=True,
        is_access_controlled=True,
    )
    return set(
        applications.filter(
            Q(allowed_groups__user=user) | Q(allowed_users=user)
        )
        .values_list("key", flat=True)
        .distinct()
    )


def get_core_bootstrap(request: HttpRequest) -> dict[str, object]:
    configuration_payload = serialize_shell_configuration(get_active_configuration())
    user = request.user
    authenticated = user.is_authenticated
    navigation_payload: list[dict[str, object]] = []

    if authenticated:
        items = (
            NavigationItem.objects.filter(
                is_enabled=True,
                application__is_enabled=True,
            )
            .select_related("application", "parent")
        )

        accessible_application_keys = get_user_accessible_application_keys(user)
        permitted_items: list[NavigationItem] = []
        for item in items:
            if item.requires_staff and not user.is_staff:
                continue
            if item.key == "dashboard":
                permitted_items.append(item)
                continue
            if (
                item.application.is_access_controlled
                and item.application.key not in accessible_application_keys
            ):
                continue
            permitted_items.append(item)

        permitted_item_keys = {item.key for item in permitted_items}
        for item in permitted_items:
            if item.parent and item.parent.key not in permitted_item_keys:
                # A container is retained when it has at least one accessible child.
                parent = item.parent
                navigation_payload.append(
                    {
                        "key": parent.key,
                        "label": parent.label,
                        "path": parent.path,
                        "icon": parent.icon,
                        "position": parent.position,
                        "parent_key": parent.parent.key if parent.parent else None,
                        "application_key": parent.application.key,
                        "is_separator": parent.is_separator,
                    }
                )
                permitted_item_keys.add(parent.key)

            navigation_payload.append(
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
            )

    return {
        "authenticated": authenticated,
        "configuration": configuration_payload,
        "user": serialize_session_user(user) if authenticated else None,
        "navigation": navigation_payload,
        "accessible_application_keys": sorted(accessible_application_keys)
        if authenticated
        else [],
    }
