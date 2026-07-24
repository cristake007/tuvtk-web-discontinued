from rest_framework import serializers


class AccountUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    is_staff = serializers.BooleanField()


class AuthenticationSessionSerializer(serializers.Serializer):
    authenticated = serializers.BooleanField()
    user = AccountUserSerializer(allow_null=True)


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(trim_whitespace=False, write_only=True)


class ErrorDetailSerializer(serializers.Serializer):
    detail = serializers.CharField()
