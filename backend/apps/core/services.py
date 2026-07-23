from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.http import HttpRequest

from .models import ApplicationConfiguration, NavigationItem


DEFAULT_CONFIGURATION = {
    "site_name": "TUVTK",
    "organization_name": "TÜV Thüringen Karpat",
    "sidebar_title": "Workspace",
}


def serialize_shell_user(user: AbstractBaseUser) -> dict[str, object]:
    display_name = user.get_full_name().strip() or user.get_username()

    return {
        "id": user.pk,
        "username": user.get_username(),
        "display_name": display_name,
        "email": user.email,
        "is_staff": user.is_staff,
    }


def serialize_authentication_session(
    user: AbstractBaseUser | AnonymousUser,
) -> dict[str, object]:
    if not user.is_authenticated:
        return {
            "authenticated": False,
            "user": None,
        }

    return {
        "authenticated": True,
        "user": serialize_shell_user(user),
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
        "user": serialize_shell_user(user),
        "navigation": navigation_payload,
    }
