from django.contrib.auth.models import AbstractBaseUser, AnonymousUser

AUTHENTICATION_ENDPOINTS = {
    "csrf": "/api/v1/auth/csrf",
    "session": "/api/v1/auth/session",
    "login": "/api/v1/auth/login",
    "logout": "/api/v1/auth/logout",
}


def get_authentication_endpoints() -> dict[str, str]:
    return AUTHENTICATION_ENDPOINTS.copy()


def serialize_session_user(user: AbstractBaseUser) -> dict[str, object]:
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
        "user": serialize_session_user(user),
    }
