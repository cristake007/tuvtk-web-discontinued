from pathlib import PurePosixPath
from urllib.parse import quote

from django.core.files.storage import default_storage
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class AuthenticatedMediaView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(exclude=True)
    def get(self, request, file_path: str):
        normalized_path = PurePosixPath(file_path)
        if (
            normalized_path.is_absolute()
            or ".." in normalized_path.parts
            or not default_storage.exists(file_path)
        ):
            return HttpResponse(status=404)

        response = HttpResponse()
        response["X-Accel-Redirect"] = (
            f"/_protected_media/{quote(file_path, safe='/')}"
        )
        response["Cache-Control"] = "private, no-store"
        return response
