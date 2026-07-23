from typing import Literal

from django.db import connections
from django.http import HttpRequest
from ninja import NinjaAPI, Schema
from ninja.security import django_auth

from apps.core.api import router as core_router


class DatabaseHealth(Schema):
    alias: str
    status: Literal["ok", "error"]


class HealthResponse(Schema):
    status: Literal["ok", "degraded"]
    databases: dict[str, DatabaseHealth]


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

api.add_router("/core", core_router)


def _database_status(alias: str) -> Literal["ok", "error"]:
    try:
        with connections[alias].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return "error"

    return "ok"


@api.get(
    "/health",
    response={200: HealthResponse, 503: HealthResponse},
    auth=None,
    tags=["system"],
    summary="Check API and database health",
)
def health(request: HttpRequest) -> tuple[int, dict[str, object]]:
    databases = {
        "core": {
            "alias": "default",
            "status": _database_status("default"),
        },
        "registry": {
            "alias": "registry",
            "status": _database_status("registry"),
        },
    }

    healthy = all(database["status"] == "ok" for database in databases.values())

    return (
        200 if healthy else 503,
        {
            "status": "ok" if healthy else "degraded",
            "databases": databases,
        },
    )


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
