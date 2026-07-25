from rest_framework import serializers

from apps.authentication.serializers import ErrorDetailSerializer, SessionUserSerializer


class ShellConfigurationSerializer(serializers.Serializer):
    site_name = serializers.CharField()
    organization_name = serializers.CharField()
    sidebar_title = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)


class PublicBrandingSerializer(serializers.Serializer):
    site_name = serializers.CharField()
    organization_name = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)


class NavigationItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    path = serializers.CharField()
    icon = serializers.CharField()
    position = serializers.IntegerField()
    parent_key = serializers.CharField(allow_null=True)
    application_key = serializers.CharField()


class CoreBootstrapSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    configuration = ShellConfigurationSerializer()
    user = SessionUserSerializer(allow_null=True)
    navigation = NavigationItemSerializer(many=True)


class CompanyLogoUploadSerializer(serializers.Serializer):
    logo = serializers.FileField()


__all__ = [
    "CompanyLogoUploadSerializer",
    "CoreBootstrapSerializer",
    "ErrorDetailSerializer",
    "NavigationItemSerializer",
    "PublicBrandingSerializer",
    "ShellConfigurationSerializer",
]
