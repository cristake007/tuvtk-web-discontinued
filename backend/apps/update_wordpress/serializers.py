from pathlib import Path

from rest_framework import serializers

from config.error_serializers import ApiErrorSerializer

from .domain import parse_effective_end_date
from .files import TABULAR_EXTENSIONS
from .validators import InvalidWordPressUrlError, validate_http_url_syntax

MAX_UPLOAD_BYTES = 20 * 1024 * 1024


def _validate_base_url(value: str) -> str:
    try:
        return validate_http_url_syntax(value)
    except InvalidWordPressUrlError as exc:
        raise serializers.ValidationError(str(exc)) from exc


def _validate_date_list(values: list[str], field: str) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        if parse_effective_end_date(value) is None:
            raise serializers.ValidationError(f'Câmpul „{field}” conține o dată invalidă.')
        cleaned.append(value)
    return cleaned


def _validate_slug_or_permalink(attrs: dict) -> dict:
    if not attrs.get("slug") and not attrs.get("permalink"):
        raise serializers.ValidationError("Lipsește slug-ul sau permalink-ul.")
    return attrs


class UpdateWordPressErrorDetailSerializer(ApiErrorSerializer):
    pass


class ConnectionSettingsSerializer(serializers.Serializer):
    wp_base_url = serializers.CharField(allow_blank=True)
    wp_username = serializers.CharField(allow_blank=True)


class ConnectRequestSerializer(serializers.Serializer):
    wp_base_url = serializers.CharField(max_length=2048, allow_blank=False)
    wp_username = serializers.CharField(max_length=150, allow_blank=False)
    wp_app_password = serializers.CharField(max_length=500, allow_blank=False)

    def validate_wp_base_url(self, value):
        return _validate_base_url(value)


class ConnectResponseSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(allow_null=True)
    user_name = serializers.CharField()


class PreviewUploadSerializer(serializers.Serializer):
    input_file = serializers.FileField()

    def validate_input_file(self, value):
        extension = Path(value.name).suffix.casefold()
        if extension not in TABULAR_EXTENSIONS:
            allowed = ", ".join(sorted(TABULAR_EXTENSIONS))
            raise serializers.ValidationError(
                f"Fișierul trebuie să aibă unul dintre formatele: {allowed}."
            )
        if value.size <= 0:
            raise serializers.ValidationError("Fișierul este gol.")
        if value.size > MAX_UPLOAD_BYTES:
            raise serializers.ValidationError("Fișierul trebuie să aibă cel mult 20 MB.")
        return value


class SafeCourseDateRowSerializer(serializers.Serializer):
    row_index = serializers.IntegerField()
    title = serializers.CharField(allow_blank=True)
    permalink = serializers.CharField(allow_blank=True)
    slug = serializers.CharField(allow_blank=True)
    post_id = serializers.IntegerField(allow_null=True)
    existing_valid_dates = serializers.ListField(child=serializers.CharField())
    excel_dates = serializers.ListField(child=serializers.CharField())
    final_dates = serializers.ListField(child=serializers.CharField())
    status = serializers.CharField()
    error = serializers.CharField(allow_null=True)
    can_update = serializers.BooleanField()
    payload = serializers.JSONField()


class PreviewResponseSerializer(serializers.Serializer):
    rows = SafeCourseDateRowSerializer(many=True)


class UpdateRowRequestSerializer(serializers.Serializer):
    wp_base_url = serializers.CharField(max_length=2048, allow_blank=False)
    wp_username = serializers.CharField(max_length=150, allow_blank=False)
    wp_app_password = serializers.CharField(max_length=500, allow_blank=False)
    permalink = serializers.CharField(max_length=2048, allow_blank=True, required=False, default="")
    slug = serializers.CharField(max_length=300, allow_blank=True, required=False, default="")
    post_id = serializers.IntegerField(
        min_value=1, max_value=2_147_483_647, required=False, allow_null=True, default=None
    )
    final_dates = serializers.ListField(child=serializers.CharField(max_length=50), max_length=1000)

    def validate_wp_base_url(self, value):
        return _validate_base_url(value)

    def validate_final_dates(self, value):
        return _validate_date_list(value, "final_dates")

    def validate(self, attrs):
        return _validate_slug_or_permalink(attrs)


class UpdateRowResponseSerializer(serializers.Serializer):
    post_id = serializers.IntegerField(allow_null=True)
    status = serializers.CharField(required=False)
    updated = serializers.BooleanField(required=False)
    final_dates = serializers.ListField(child=serializers.CharField(), required=False)


class FetchCurrentDatesRequestSerializer(serializers.Serializer):
    wp_base_url = serializers.CharField(max_length=2048, allow_blank=False)
    wp_username = serializers.CharField(max_length=150, allow_blank=False)
    wp_app_password = serializers.CharField(max_length=500, allow_blank=False)
    permalink = serializers.CharField(max_length=2048, allow_blank=True, required=False, default="")
    slug = serializers.CharField(max_length=300, allow_blank=True, required=False, default="")
    post_id = serializers.IntegerField(
        min_value=1, max_value=2_147_483_647, required=False, allow_null=True, default=None
    )
    excel_dates = serializers.ListField(
        child=serializers.CharField(max_length=50), max_length=1000, required=False, default=list
    )

    def validate_wp_base_url(self, value):
        return _validate_base_url(value)

    def validate_excel_dates(self, value):
        return _validate_date_list(value, "excel_dates")

    def validate(self, attrs):
        return _validate_slug_or_permalink(attrs)


class FetchCurrentDatesResponseSerializer(serializers.Serializer):
    post_id = serializers.IntegerField(allow_null=True)
    existing_valid_dates = serializers.ListField(child=serializers.CharField(), required=False)
    final_dates = serializers.ListField(child=serializers.CharField(), required=False)
    payload = serializers.JSONField(required=False)
    can_update = serializers.BooleanField(required=False)


class ResolvePostIdRequestSerializer(serializers.Serializer):
    wp_base_url = serializers.CharField(max_length=2048, allow_blank=False)
    wp_username = serializers.CharField(max_length=150, allow_blank=True, required=False, default="")
    permalink = serializers.CharField(max_length=2048, allow_blank=True, required=False, default="")
    slug = serializers.CharField(max_length=300, allow_blank=True, required=False, default="")

    def validate_wp_base_url(self, value):
        return _validate_base_url(value)

    def validate(self, attrs):
        return _validate_slug_or_permalink(attrs)


class ResolvePostIdResponseSerializer(serializers.Serializer):
    post_id = serializers.IntegerField()
