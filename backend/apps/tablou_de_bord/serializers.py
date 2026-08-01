from rest_framework import serializers


class RezumatTablouDeBordSerializer(serializers.Serializer):
    titlu = serializers.CharField()
    descriere = serializers.CharField()
    module = serializers.ListField(child=serializers.DictField())
