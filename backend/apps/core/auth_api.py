from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect, ensure_csrf_cookie
from ninja import Router
from ninja.decorators import decorate_view
from ninja.security import django_auth

from .schemas import ErrorSchema, LoginRequestSchema, ShellUserSchema
from .services import serialize_shell_user


router = Router(tags=["authentication"])


@router.get(
    "/csrf",
    auth=None,
    response={204: None},
    summary="Set the Django CSRF cookie",
)
@ensure_csrf_cookie
@csrf_exempt
def csrf_cookie(request: HttpRequest) -> HttpResponse:
    return HttpResponse(status=204)


@router.post(
    "/login",
    auth=None,
    response={200: ShellUserSchema, 401: ErrorSchema},
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
    return serialize_shell_user(user)


@router.get(
    "/me",
    auth=django_auth,
    response=ShellUserSchema,
    summary="Return the authenticated session user",
)
def current_user(request: HttpRequest) -> dict[str, object]:
    return serialize_shell_user(request.auth)


@router.post(
    "/logout",
    auth=django_auth,
    response={204: None},
    summary="End the current Django login session",
)
def logout(request: HttpRequest) -> tuple[int, None]:
    django_logout(request)
    return 204, None
