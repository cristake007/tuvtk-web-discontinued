from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RezumatTablouDeBordSerializer
from .services import obtine_rezumat_tablou_de_bord


class RezumatTablouDeBordView(APIView):
    @extend_schema(
        operation_id="tablou_de_bord_rezumat",
        responses=RezumatTablouDeBordSerializer,
        summary="Returnează rezumatul tabloului de bord",
        tags=["tablou-de-bord"],
    )
    def get(self, request):
        return Response(RezumatTablouDeBordSerializer(obtine_rezumat_tablou_de_bord()).data)
