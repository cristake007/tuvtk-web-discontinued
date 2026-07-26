from rest_framework import serializers

from apps.authentication.serializers import ErrorDetailSerializer, SessionUserSerializer


class ShellConfigurationSerializer(serializers.Serializer):
    site_name = serializers.CharField()
    organization_name = serializers.CharField()
    sidebar_title = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)
    culoare_primara = serializers.CharField()
    culoare_accent = serializers.CharField()
    culoare_fundal = serializers.CharField()


class PublicBrandingSerializer(serializers.Serializer):
    site_name = serializers.CharField()
    organization_name = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)
    culoare_primara = serializers.CharField()
    culoare_accent = serializers.CharField()
    culoare_fundal = serializers.CharField()


class ActualizareInterfataUtilizatorSerializer(serializers.Serializer):
    site_name = serializers.CharField(max_length=120, required=False, trim_whitespace=True)
    culoare_primara = serializers.RegexField(r"^#[0-9A-Fa-f]{6}$", required=False)
    culoare_accent = serializers.RegexField(r"^#[0-9A-Fa-f]{6}$", required=False)
    culoare_fundal = serializers.RegexField(r"^#[0-9A-Fa-f]{6}$", required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Transmite cel puțin o setare de actualizat.")
        return attrs


class OrdineMeniuSerializer(serializers.Serializer):
    chei = serializers.ListField(child=serializers.CharField(), allow_empty=False)


class NavigationItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    path = serializers.CharField()
    icon = serializers.CharField()
    position = serializers.IntegerField()
    parent_key = serializers.CharField(allow_null=True)
    application_key = serializers.CharField()
    is_separator = serializers.BooleanField()


class CoreBootstrapSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    configuration = ShellConfigurationSerializer()
    user = SessionUserSerializer(allow_null=True)
    navigation = NavigationItemSerializer(many=True)


class CompanyLogoUploadSerializer(serializers.Serializer):
    logo = serializers.FileField()


__all__ = [
    "CompanyLogoUploadSerializer",
    "ActualizareInterfataUtilizatorSerializer",
    "CoreBootstrapSerializer",
    "ErrorDetailSerializer",
    "NavigationItemSerializer",
    "PublicBrandingSerializer",
    "OrdineMeniuSerializer",
    "ShellConfigurationSerializer",
]
