from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.companii.models import Companie
from apps.core.permissions import HasApplicationAccess

from .filters import ContactFilter
from .models import Contact
from .serializers import CompanyListSerializer, ContactSerializer, OwnerListSerializer
from .services import archive_contact, restore_contact


class ContactPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema_view(
    list=extend_schema(summary="Listează contactele", tags=["contacte"]),
    create=extend_schema(summary="Creează un contact", tags=["contacte"]),
    retrieve=extend_schema(summary="Returnează un contact", tags=["contacte"]),
    partial_update=extend_schema(summary="Actualizează un contact", tags=["contacte"]),
)
class ContactViewSet(viewsets.ModelViewSet):
    application_key = "contacte"
    permission_classes = [HasApplicationAccess]
    serializer_class = ContactSerializer
    pagination_class = ContactPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ContactFilter
    ordering_fields = ("first_name", "last_name", "created_at", "updated_at", "status")
    ordering = ("last_name", "first_name", "pk")
    http_method_names = ("get", "post", "patch", "head", "options")

    def get_queryset(self):
        return Contact.objects.select_related("company", "owner")

    @extend_schema(request=None, responses={200: ContactSerializer}, summary="Arhivează un contact", tags=["contacte"])
    @action(detail=True, methods=("post",))
    def archive(self, request, pk=None):
        return Response(self.get_serializer(archive_contact(self.get_object())).data)

    @extend_schema(request=None, responses={200: ContactSerializer}, summary="Restaurează un contact", tags=["contacte"])
    @action(detail=True, methods=("post",))
    def restore(self, request, pk=None):
        return Response(self.get_serializer(restore_contact(self.get_object())).data)


class OwnerListView(APIView):
    application_key = "contacte"
    permission_classes = [HasApplicationAccess]

    @extend_schema(responses={200: OwnerListSerializer(many=True)}, tags=["contacte"])
    def get(self, request):
        users = get_user_model().objects.filter(is_active=True).order_by("last_name", "first_name", "username")
        data = [{"id": user.pk, "display_name": user.get_full_name().strip() or user.get_username()} for user in users]
        return Response(data, status=status.HTTP_200_OK)


class CompanyListView(APIView):
    application_key = "contacte"
    permission_classes = [HasApplicationAccess]

    @extend_schema(responses={200: CompanyListSerializer(many=True)}, tags=["contacte"])
    def get(self, request):
        return Response(CompanyListSerializer(Companie.objects.order_by("name", "pk"), many=True).data)
