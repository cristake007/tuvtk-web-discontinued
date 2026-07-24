from rest_framework import serializers


class DatabaseHealthSerializer(serializers.Serializer):
    alias = serializers.CharField()
    status = serializers.ChoiceField(choices=("ok", "error"))


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("ok", "degraded"))
    databases = serializers.DictField(child=DatabaseHealthSerializer())
