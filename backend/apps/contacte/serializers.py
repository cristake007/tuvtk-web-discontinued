from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.companii.models import Companie

from .models import Contact
from .services import save_contact


class CompanyReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Companie
        fields = ("id", "name", "is_archived")


class OwnerSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ("id", "display_name")

    def get_display_name(self, obj) -> str:
        return obj.get_full_name().strip() or obj.get_username()


class ContactSerializer(serializers.ModelSerializer):
    company_detail = CompanyReferenceSerializer(source="company", read_only=True)
    owner_detail = OwnerSerializer(source="owner", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Contact
        fields = (
            "id", "first_name", "last_name", "job_title", "company", "company_detail",
            "email", "phone", "mobile_phone", "status", "status_label", "owner",
            "owner_detail", "notes", "is_archived", "archived_at", "created_at", "updated_at",
        )
        read_only_fields = ("is_archived", "archived_at", "created_at", "updated_at")
        extra_kwargs = {
            "first_name": {"allow_blank": False},
            "last_name": {"allow_blank": False},
            "company": {"allow_null": True, "required": False},
        }

    def validate_first_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Prenumele este obligatoriu.")
        return value

    def validate_last_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Numele este obligatoriu.")
        return value

    def create(self, validated_data):
        return save_contact(**validated_data)

    def update(self, instance, validated_data):
        return save_contact(instance=instance, **validated_data)


class OwnerListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()


class CompanyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Companie
        fields = ("id", "name", "is_archived")
