from rest_framework import serializers


class DatabaseHealthSerializer(serializers.Serializer):
    alias = serializers.CharField()
    status = serializers.ChoiceField(choices=("ok", "error"))


class HealthDatabasesSerializer(serializers.Serializer):
    core = DatabaseHealthSerializer()
    registry = DatabaseHealthSerializer()


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=("ok", "degraded"))
    databases = HealthDatabasesSerializer()
