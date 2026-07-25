from collections.abc import Mapping, Sequence
from typing import Any

from rest_framework import serializers


def first_serializer_error(errors: Any) -> str:
    if isinstance(errors, Mapping):
        for value in errors.values():
            return first_serializer_error(value)
    if isinstance(errors, Sequence) and not isinstance(errors, (str, bytes)) and errors:
        return first_serializer_error(errors[0])
    return str(errors)


class ApiErrorSerializer(serializers.Serializer):
    code = serializers.CharField()
    detail = serializers.CharField()
    fields = serializers.DictField()
