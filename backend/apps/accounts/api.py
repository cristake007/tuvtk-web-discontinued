from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from ninja import Router
from ninja.decorators import decorate_view

from .schemas import (
    AuthenticationErrorSchema,
    AuthenticationSessionSchema,
    LoginRequestSchema,
)
from .services import serialize_authentication_session


router = Router(tags=["authentication"])


@router.get(
    "/csrf",
    auth=None,
    response={204: None},
    summary="Set the Django CSRF cookie",
)
@decorate_view(ensure_csrf_cookie)
def csrf_cookie(request: HttpRequest) -> HttpResponse:
    return HttpResponse(status=204)


@router.get(
    "/session",
    auth=None,
    response=AuthenticationSessionSchema,
    summary="Return the current browser session state",
)
def session(request: HttpRequest) -> dict[str, object]:
    return serialize_authentication_session(request.user)


@router.post(
    "/login",
    auth=None,
    response={200: AuthenticationSessionSchema, 401: AuthenticationErrorSchema},
    summary="Create a Django login session",
)
@decorate_view(csrf_protect)
def login(
    request: HttpRequest,
    payload: LoginRequestSchema,
) -> dict[str, object] | tuple[int, dict[str, str]]:
    user = authenticate(
        request,
        username=payload.username,
        password=payload.password,
    )

    if user is None or not user.is_active:
        return 401, {"detail": "Invalid username or password."}

    django_login(request, user)
    return serialize_authentication_session(user)


@router.post(
    "/logout",
    auth=None,
    response={204: None},
    summary="End the current Django login session",
)
@decorate_view(csrf_protect)
def logout(request: HttpRequest) -> tuple[int, None]:
    django_logout(request)
    return 204, None
