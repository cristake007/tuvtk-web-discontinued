from django.db import connections
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .api_serializers import HealthResponseSerializer


def database_status(alias: str) -> str:
    if alias not in connections.databases:
        return "disabled"

    try:
        with connections[alias].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        return "error"

    return "ok"


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="system_health",
        responses={
            200: HealthResponseSerializer,
            503: HealthResponseSerializer,
        },
        summary="Check API and database health",
        tags=["system"],
    )
    def get(self, request):
        databases = {
            "core": {
                "alias": "default",
                "status": database_status("default"),
            },
            "registry": {
                "alias": "registry",
                "status": database_status("registry"),
            },
        }
        core_healthy = databases["core"]["status"] == "ok"
        all_healthy = core_healthy and databases["registry"]["status"] == "ok"
        payload = {
            "status": "ok" if all_healthy else "degraded",
            "databases": databases,
        }
        response_status = (
            status.HTTP_200_OK if core_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(HealthResponseSerializer(payload).data, status=response_status)
