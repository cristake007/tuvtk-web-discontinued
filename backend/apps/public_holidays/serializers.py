from rest_framework import serializers

from config.error_serializers import ApiErrorSerializer
from config.formats import ROMANIAN_DATE_FORMAT

from .models import PublicHoliday, PublicHolidaySettings


class RomanianDateField(serializers.DateField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("format", ROMANIAN_DATE_FORMAT)
        kwargs.setdefault("input_formats", [ROMANIAN_DATE_FORMAT, "iso-8601"])
        super().__init__(*args, **kwargs)


class PublicHolidayErrorDetailSerializer(ApiErrorSerializer):
    pass


class PublicHolidaySerializer(serializers.ModelSerializer):
    date = RomanianDateField()

    class Meta:
        model = PublicHoliday
        fields = (
            "id",
            "date",
            "local_name",
            "english_name",
            "description",
            "source",
            "is_internal",
            "created_at",
            "updated_at",
        )


class PublicHolidaySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHolidaySettings
        fields = (
            "enabled",
            "automatic_sync",
            "frequency",
            "last_attempted_at",
            "last_successful_at",
            "next_sync_at",
            "last_status",
            "last_error",
            "last_accepted_count",
            "last_created_count",
            "last_updated_count",
            "last_removed_count",
            "sync_in_progress",
            "updated_at",
        )
        read_only_fields = (
            "last_attempted_at",
            "last_successful_at",
            "next_sync_at",
            "last_status",
            "last_error",
            "last_accepted_count",
            "last_created_count",
            "last_updated_count",
            "last_removed_count",
            "sync_in_progress",
            "updated_at",
        )


class PublicHolidaySettingsUpdateSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    automatic_sync = serializers.BooleanField()
    frequency = serializers.ChoiceField(
        choices=PublicHolidaySettings.Frequency.choices
    )


class InternalHolidayWriteSerializer(serializers.ModelSerializer):
    date = RomanianDateField()

    class Meta:
        model = PublicHoliday
        fields = ("date", "local_name", "description")

    def validate_local_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Denumirea zilei interne este obligatorie.")
        if any(char in value for char in "<>="):
            raise serializers.ValidationError("Denumirea conține caractere neacceptate.")
        return value


class SynchronizationResultSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("success", "skipped", "failed"))
    message = serializers.CharField()
    accepted = serializers.IntegerField(min_value=0)
    created = serializers.IntegerField(min_value=0)
    updated = serializers.IntegerField(min_value=0)
    removed = serializers.IntegerField(min_value=0)
