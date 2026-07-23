from typing import Literal

from django.db import connections
from django.http import HttpRequest
from ninja import NinjaAPI, Schema
from ninja.security import django_auth


class HealthResponse(Schema):
    status: Literal["ok"]
    database: Literal["ok"]


class CurrentUserResponse(Schema):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    is_staff: bool
    is_superuser: bool


api = NinjaAPI(
    title="TUVTK API",
    version="1.0.0",
    urls_namespace="api-v1",
    docs_url="/docs",
    openapi_url="/openapi.json",
)


@api.get(
    "/health",
    response=HealthResponse,
    auth=None,
    tags=["system"],
    summary="Check API and core database health",
)
def health(request: HttpRequest) -> dict[str, str]:
    with connections["default"].cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()

    return {"status": "ok", "database": "ok"}


@api.get(
    "/me",
    response=CurrentUserResponse,
    auth=django_auth,
    tags=["system"],
    summary="Return the authenticated Django user",
)
def current_user(request: HttpRequest) -> dict[str, object]:
    user = request.auth

    return {
        "id": user.pk,
        "username": user.get_username(),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }
