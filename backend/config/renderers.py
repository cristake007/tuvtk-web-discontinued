from collections.abc import Mapping, Sequence
from typing import Any

from rest_framework.renderers import JSONRenderer

ERROR_CODES_BY_STATUS = {
    400: "validation_error",
    401: "authentication_required",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    415: "unsupported_media_type",
    429: "throttled",
}


def _first_message(value: Any) -> str | None:
    if isinstance(value, str):
        return value
    if isinstance(value, Mapping):
        for item in value.values():
            message = _first_message(item)
            if message:
                return message
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        for item in value:
            message = _first_message(item)
            if message:
                return message
    return None


def normalize_error_payload(data: Any, status_code: int) -> dict[str, Any]:
    if isinstance(data, Mapping) and {"code", "detail", "fields"}.issubset(data):
        return {
            "code": str(data["code"]),
            "detail": str(data["detail"]),
            "fields": data["fields"] if isinstance(data["fields"], Mapping) else {},
        }

    fields: dict[str, Any] = {}
    detail: str | None = None
    code = ERROR_CODES_BY_STATUS.get(status_code, "api_error")

    if isinstance(data, Mapping):
        raw_code = data.get("code")
        if isinstance(raw_code, str):
            code = raw_code
        detail = _first_message(data.get("detail"))
        fields = {
            str(key): value
            for key, value in data.items()
            if key not in {"code", "detail", "fields"}
        }
        explicit_fields = data.get("fields")
        if isinstance(explicit_fields, Mapping):
            fields.update({str(key): value for key, value in explicit_fields.items()})
        if detail is None:
            detail = _first_message(fields)
    else:
        detail = _first_message(data)

    if detail is None:
        detail = "Cererea API nu a putut fi procesată."

    return {"code": code, "detail": detail, "fields": fields}


class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")
        if response is not None and response.status_code >= 400:
            data = normalize_error_payload(data, response.status_code)
        return super().render(data, accepted_media_type, renderer_context)
