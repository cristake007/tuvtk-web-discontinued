from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import HasApplicationAccess

from .filters import CompanieFilter
from .models import Companie
from .serializers import CompanieSerializer, OwnerListSerializer
from .services import archive_company, restore_company


class CompaniePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema_view(
    list=extend_schema(summary="Listează companiile", tags=["companii"]),
    create=extend_schema(summary="Creează o companie", tags=["companii"]),
    retrieve=extend_schema(summary="Returnează o companie", tags=["companii"]),
    partial_update=extend_schema(summary="Actualizează o companie", tags=["companii"]),
)
class CompanieViewSet(viewsets.ModelViewSet):
    application_key = "companii"
    permission_classes = [HasApplicationAccess]
    serializer_class = CompanieSerializer
    pagination_class = CompaniePagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = CompanieFilter
    ordering_fields = ("name", "created_at", "updated_at", "status")
    ordering = ("name", "pk")
    http_method_names = ("get", "post", "patch", "head", "options")

    def get_queryset(self):
        return Companie.objects.select_related("owner")

    @extend_schema(
        request=None,
        responses={200: CompanieSerializer},
        summary="Arhivează o companie",
        tags=["companii"],
    )
    @action(detail=True, methods=("post",))
    def archive(self, request, pk=None):
        return Response(self.get_serializer(archive_company(self.get_object())).data)

    @extend_schema(
        request=None,
        responses={200: CompanieSerializer},
        summary="Restaurează o companie",
        tags=["companii"],
    )
    @action(detail=True, methods=("post",))
    def restore(self, request, pk=None):
        return Response(self.get_serializer(restore_company(self.get_object())).data)


class OwnerListView(APIView):
    application_key = "companii"
    permission_classes = [HasApplicationAccess]

    @extend_schema(responses={200: OwnerListSerializer(many=True)}, tags=["companii"])
    def get(self, request):
        users = (
            get_user_model()
            .objects.filter(is_active=True)
            .order_by("last_name", "first_name", "username")
        )
        data = [
            {"id": user.pk, "display_name": user.get_full_name().strip() or user.get_username()}
            for user in users
        ]
        return Response(data, status=status.HTTP_200_OK)
