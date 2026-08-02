from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import serializers

from .models import Companie
from .services import normalize_cui, save_company


class OwnerSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ("id", "display_name")

    def get_display_name(self, obj) -> str:
        return obj.get_full_name().strip() or obj.get_username()


class CompanieSerializer(serializers.ModelSerializer):
    cui = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    owner_detail = OwnerSerializer(source="owner", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    vat_status_label = serializers.CharField(source="get_vat_status_display", read_only=True)

    class Meta:
        model = Companie
        fields = (
            "id",
            "name",
            "legal_name",
            "cui",
            "trade_registry_number",
            "vat_status",
            "vat_status_label",
            "status",
            "status_label",
            "website",
            "email",
            "phone",
            "street",
            "city",
            "county",
            "postal_code",
            "country",
            "owner",
            "owner_detail",
            "notes",
            "is_archived",
            "archived_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("is_archived", "archived_at", "created_at", "updated_at")
        extra_kwargs = {"name": {"allow_blank": False}}

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Numele companiei este obligatoriu.")
        return value

    def validate_cui(self, value: str | None) -> str:
        try:
            normalized = normalize_cui(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc
        queryset = Companie.objects.filter(cui=normalized)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if normalized and queryset.exists():
            raise serializers.ValidationError("Există deja o companie cu acest CUI.")
        return normalized

    def create(self, validated_data):
        try:
            return save_company(**validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"cui": "Există deja o companie cu acest CUI."}
            ) from exc

    def update(self, instance, validated_data):
        try:
            return save_company(instance=instance, **validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"cui": "Există deja o companie cu acest CUI."}
            ) from exc


class OwnerListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()
