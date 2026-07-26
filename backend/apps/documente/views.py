from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasApplicationAccess

from .serializers import RezumatDocumenteSerializer
from .services import obtine_rezumat_documente


class RezumatDocumenteView(APIView):
    application_key = "documents"
    permission_classes = [HasApplicationAccess]
    @extend_schema(
        operation_id="documente_rezumat",
        responses=RezumatDocumenteSerializer,
        summary="Returnează rezumatul modulului de documente",
        tags=["documente"],
    )
    def get(self, request):
        return Response(RezumatDocumenteSerializer(obtine_rezumat_documente()).data)
