from rest_framework import serializers


class RezumatDocumenteSerializer(serializers.Serializer):
    titlu = serializers.CharField()
    descriere = serializers.CharField()
    documente = serializers.ListField(child=serializers.DictField())
