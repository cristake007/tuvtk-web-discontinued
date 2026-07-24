from django.http import HttpRequest

from apps.accounts.services import serialize_account_user

from .models import ApplicationConfiguration, NavigationItem


DEFAULT_CONFIGURATION = {
    "site_name": "TUVTK",
    "organization_name": "TÜV Thüringen Karpat",
    "sidebar_title": "Workspace",
}


def get_core_bootstrap(request: HttpRequest) -> dict[str, object]:
    configuration = (
        ApplicationConfiguration.objects.filter(is_active=True)
        .order_by("pk")
        .first()
    )

    configuration_payload = (
        {
            "site_name": configuration.site_name,
            "organization_name": configuration.organization_name,
            "sidebar_title": configuration.sidebar_title,
        }
        if configuration
        else DEFAULT_CONFIGURATION
    )

    user = request.user
    navigation_payload: list[dict[str, object]] = []

    items = NavigationItem.objects.filter(is_enabled=True).select_related("parent")

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
            }
        )

    return {
        "configuration": configuration_payload,
        "user": serialize_account_user(user),
        "navigation": navigation_payload,
    }
