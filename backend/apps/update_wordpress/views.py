from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasApplicationAccess

from .client import WordPressRequestError
from .files import UpdateWordPressFileError
from .serializers import (
    ConnectionSettingsSerializer,
    ConnectRequestSerializer,
    ConnectResponseSerializer,
    FetchCurrentDatesRequestSerializer,
    FetchCurrentDatesResponseSerializer,
    PreviewResponseSerializer,
    PreviewUploadSerializer,
    ResolvePostIdRequestSerializer,
    ResolvePostIdResponseSerializer,
    UpdateRowRequestSerializer,
    UpdateRowResponseSerializer,
    UpdateWordPressErrorDetailSerializer,
)
from .services import (
    build_preview_rows,
    build_wp_client,
    fetch_current_dates,
    get_connection_settings,
    save_connection_settings,
    update_course_row,
)
from .validators import InvalidWordPressUrlError

APPLICATION_KEY = "planificator-cursuri"
TAGS = ["update-wordpress"]


class UpdateWordPressAPIView(APIView):
    application_key = APPLICATION_KEY
    permission_classes = [HasApplicationAccess]


class SafeCourseDateUpdaterSettingsView(UpdateWordPressAPIView):
    @extend_schema(
        operation_id="update_wordpress_settings_read",
        responses=ConnectionSettingsSerializer,
        summary="Return the saved WordPress connection settings",
        tags=TAGS,
    )
    def get(self, request):
        settings = get_connection_settings()
        payload = {"wp_base_url": settings.wp_base_url, "wp_username": settings.wp_username}
        return Response(ConnectionSettingsSerializer(payload).data)


class ConnectView(UpdateWordPressAPIView):
    @extend_schema(
        operation_id="update_wordpress_connect",
        request=ConnectRequestSerializer,
        responses={
            200: ConnectResponseSerializer,
            400: UpdateWordPressErrorDetailSerializer,
            502: UpdateWordPressErrorDetailSerializer,
        },
        summary="Verify WordPress credentials and save the connection settings",
        tags=TAGS,
    )
    def post(self, request):
        serializer = ConnectRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        client = build_wp_client(
            wp_base_url=values["wp_base_url"],
            wp_username=values["wp_username"],
            wp_app_password=values["wp_app_password"],
        )

        try:
            user = client.test_connection()
        except InvalidWordPressUrlError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except WordPressRequestError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        save_connection_settings(
            wp_base_url=values["wp_base_url"],
            wp_username=values["wp_username"],
        )
        payload = {
            "user_id": user.get("id"),
            "user_name": user.get("name") or user.get("slug") or values["wp_username"],
        }
        return Response(ConnectResponseSerializer(payload).data)


class PreviewView(UpdateWordPressAPIView):
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        operation_id="update_wordpress_preview",
        request=PreviewUploadSerializer,
        responses={
            200: PreviewResponseSerializer,
            400: UpdateWordPressErrorDetailSerializer,
        },
        summary="Preview the course dates parsed from an uploaded schedule file",
        tags=TAGS,
    )
    def post(self, request):
        serializer = PreviewUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["input_file"]
        extension = upload.name[upload.name.rfind(".") :].casefold() if "." in upload.name else ""

        try:
            rows = build_preview_rows(upload.read(), extension)
        except UpdateWordPressFileError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PreviewResponseSerializer({"rows": rows}).data)


class UpdateRowView(UpdateWordPressAPIView):
    @extend_schema(
        operation_id="update_wordpress_update_row",
        request=UpdateRowRequestSerializer,
        responses={
            200: UpdateRowResponseSerializer,
            400: UpdateWordPressErrorDetailSerializer,
            404: UpdateWordPressErrorDetailSerializer,
            502: UpdateWordPressErrorDetailSerializer,
        },
        summary="Apply the final course dates to a single WordPress course",
        tags=TAGS,
    )
    def post(self, request):
        serializer = UpdateRowRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        client = build_wp_client(
            wp_base_url=values["wp_base_url"],
            wp_username=values["wp_username"],
            wp_app_password=values["wp_app_password"],
        )

        try:
            result = update_course_row(
                client,
                slug=values["slug"],
                permalink=values["permalink"],
                post_id=values["post_id"],
                final_dates=values["final_dates"],
            )
        except InvalidWordPressUrlError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except WordPressRequestError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if result.get("post_id") is None:
            return Response(
                {"detail": f"Cursul nu a fost găsit după slug: {values['slug']}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(UpdateRowResponseSerializer(result).data)


class FetchCurrentDatesView(UpdateWordPressAPIView):
    @extend_schema(
        operation_id="update_wordpress_fetch_current_dates",
        request=FetchCurrentDatesRequestSerializer,
        responses={
            200: FetchCurrentDatesResponseSerializer,
            400: UpdateWordPressErrorDetailSerializer,
            404: UpdateWordPressErrorDetailSerializer,
            502: UpdateWordPressErrorDetailSerializer,
        },
        summary="Fetch the current WordPress course dates and compute the proposed result",
        tags=TAGS,
    )
    def post(self, request):
        serializer = FetchCurrentDatesRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        client = build_wp_client(
            wp_base_url=values["wp_base_url"],
            wp_username=values["wp_username"],
            wp_app_password=values["wp_app_password"],
        )

        try:
            result = fetch_current_dates(
                client,
                slug=values["slug"],
                permalink=values["permalink"],
                post_id=values["post_id"],
                excel_dates=values["excel_dates"],
            )
        except InvalidWordPressUrlError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except WordPressRequestError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if result.get("post_id") is None:
            return Response(
                {"detail": f"Cursul nu a fost găsit după slug: {values['slug']}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(FetchCurrentDatesResponseSerializer(result).data)


class ResolvePostIdView(UpdateWordPressAPIView):
    @extend_schema(
        operation_id="update_wordpress_resolve_post_id",
        request=ResolvePostIdRequestSerializer,
        responses={
            200: ResolvePostIdResponseSerializer,
            400: UpdateWordPressErrorDetailSerializer,
            404: UpdateWordPressErrorDetailSerializer,
            502: UpdateWordPressErrorDetailSerializer,
        },
        summary="Resolve a WordPress course post ID from its slug or permalink",
        tags=TAGS,
    )
    def post(self, request):
        serializer = ResolvePostIdRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        values = serializer.validated_data
        client = build_wp_client(
            wp_base_url=values["wp_base_url"],
            wp_username=values["wp_username"],
            wp_app_password="",
        )

        try:
            post_id = client.resolve_course_post_id(
                slug=values["slug"], permalink=values["permalink"]
            )
        except InvalidWordPressUrlError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except WordPressRequestError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if not post_id:
            return Response(
                {"detail": "Nu s-a putut rezolva ID-ul postării din căutarea REST după slug."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(ResolvePostIdResponseSerializer({"post_id": post_id}).data)
