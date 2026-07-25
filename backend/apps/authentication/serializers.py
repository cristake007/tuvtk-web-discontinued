from rest_framework import serializers

from config.error_serializers import ApiErrorSerializer


class AuthenticationEndpointsSerializer(serializers.Serializer):
    csrf = serializers.CharField()
    session = serializers.CharField()
    login = serializers.CharField()
    logout = serializers.CharField()


class SessionUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()


class AuthenticationSessionSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    user = SessionUserSerializer(allow_null=True)


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(trim_whitespace=False, write_only=True)


class ErrorDetailSerializer(ApiErrorSerializer):
    pass
