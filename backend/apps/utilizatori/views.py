from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from config.error_serializers import ApiErrorSerializer

from .filters import UtilizatorFilter
from .serializers import (
    ApplicationGroupSerializer,
    ApplicationGroupWriteSerializer,
    AvailableApplicationSerializer,
    UserAccountSerializer,
    UserListResponseSerializer,
    UserQuerySerializer,
    UserSelectionListResponseSerializer,
    UserSelectionQuerySerializer,
    UserSelectionSerializer,
    UserWriteSerializer,
)


class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class UserSelectionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


def user_access_context(users):
    """Compute inherited and effective application access in bounded batch queries."""
    from apps.core.models import ApplicationDefinition

    user_ids = [user.pk for user in users]
    if not user_ids:
        return {}
    applications = ApplicationDefinition.objects.filter(
        is_enabled=True, is_access_controlled=True
    ).prefetch_related(
        Prefetch("allowed_groups__user_set", queryset=get_user_model().objects.filter(pk__in=user_ids)),
        Prefetch("allowed_users", queryset=get_user_model().objects.filter(pk__in=user_ids)),
    )
    inherited = {user_id: [] for user_id in user_ids}
    direct = {user_id: [] for user_id in user_ids}
    for application in applications:
        for group in application.allowed_groups.all():
            for user in group.user_set.all():
                inherited[user.pk].append(application)
        for user in application.allowed_users.all():
            direct[user.pk].append(application)
    effective = {
        user.pk: list({application.pk: application for application in inherited[user.pk] + direct[user.pk]}.values())
        for user in users
    }
    all_active_applications = list(ApplicationDefinition.objects.filter(is_enabled=True))
    for user in users:
        if user.is_superuser:
            effective[user.pk] = all_active_applications
    return {"inherited_applications": inherited, "effective_applications": effective}


class UserCollectionView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="utilizatori_list",
        parameters=[UserQuerySerializer],
        responses={200: UserListResponseSerializer, 400: ApiErrorSerializer, 403: ApiErrorSerializer},
        summary="List and filter platform users",
        tags=["utilizatori"],
    )
    def get(self, request):
        filterset = UtilizatorFilter(
            request.query_params,
            queryset=get_user_model().objects.all(),
        )
        if not filterset.is_valid():
            raise ValidationError(filterset.errors)

        queryset = filterset.qs.prefetch_related(
            "groups", "directly_allowed_applications"
        ).order_by(
            "-is_active",
            "last_name",
            "first_name",
            "username",
        )
        paginator = UserPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = UserAccountSerializer(page, many=True, context=user_access_context(page))
        return paginator.get_paginated_response(serializer.data)

    @extend_schema(
        operation_id="utilizatori_create",
        request=UserWriteSerializer,
        responses={
            201: UserAccountSerializer,
            400: ApiErrorSerializer,
            403: ApiErrorSerializer,
        },
        summary="Create a platform user",
        tags=["utilizatori"],
    )
    def post(self, request):
        serializer = UserWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save()
        return Response(UserAccountSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_user(self, user_id: int):
        return get_object_or_404(
            get_user_model().objects.prefetch_related(
                "groups", "directly_allowed_applications"
            ),
            pk=user_id,
        )

    @extend_schema(
        operation_id="utilizatori_retrieve",
        responses={
            200: UserAccountSerializer,
            403: ApiErrorSerializer,
            404: ApiErrorSerializer,
        },
        summary="Return a platform user",
        tags=["utilizatori"],
    )
    def get(self, request, user_id: int):
        user = self.get_user(user_id)
        return Response(UserAccountSerializer(user, context=user_access_context([user])).data)

    @extend_schema(
        operation_id="utilizatori_update",
        request=UserWriteSerializer,
        responses={
            200: UserAccountSerializer,
            400: ApiErrorSerializer,
            403: ApiErrorSerializer,
            404: ApiErrorSerializer,
        },
        summary="Update a platform user",
        tags=["utilizatori"],
    )
    def patch(self, request, user_id: int):
        user = self.get_user(user_id)
        serializer = UserWriteSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save()
        return Response(UserAccountSerializer(user, context=user_access_context([user])).data)


class UserSelectionView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="utilizatori_selection_list",
        parameters=[UserSelectionQuerySerializer],
        responses={200: UserSelectionListResponseSerializer, 403: ApiErrorSerializer},
        summary="Listează utilizatori pentru selectarea membrilor de grup",
        tags=["utilizatori"],
    )
    def get(self, request):
        search = request.query_params.get("search", "").strip()
        queryset = get_user_model().objects.all()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )
        queryset = queryset.order_by("last_name", "first_name", "username", "pk")
        paginator = UserSelectionPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(UserSelectionSerializer(page, many=True).data)


class ApplicationGroupCollectionView(APIView):
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Group.objects.prefetch_related(
            "allowed_applications", "user_set"
        ).order_by("name")

    @extend_schema(
        operation_id="utilizatori_group_list",
        responses={200: ApplicationGroupSerializer(many=True)},
        summary="Listează grupurile și accesul lor la aplicații",
        tags=["utilizatori"],
    )
    def get(self, request):
        return Response(ApplicationGroupSerializer(self.get_queryset(), many=True).data)

    @extend_schema(
        operation_id="utilizatori_group_create",
        request=ApplicationGroupWriteSerializer,
        responses={201: ApplicationGroupSerializer, 400: ApiErrorSerializer},
        summary="Creează un grup și stabilește accesul la aplicații",
        tags=["utilizatori"],
    )
    def post(self, request):
        serializer = ApplicationGroupWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            group = Group.objects.create(name=serializer.validated_data["name"])
            group.allowed_applications.set(serializer.validated_data["application_ids"])
            group.user_set.set(serializer.validated_data["user_ids"])
        return Response(
            ApplicationGroupSerializer(self.get_queryset().get(pk=group.pk)).data,
            status=status.HTTP_201_CREATED,
        )


class AvailableApplicationCollectionView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="utilizatori_group_available_applications",
        responses={200: AvailableApplicationSerializer(many=True)},
        summary="Listează aplicațiile disponibile pentru accesul prin grupuri",
        tags=["utilizatori"],
    )
    def get(self, request):
        from apps.core.models import ApplicationDefinition

        applications = ApplicationDefinition.objects.filter(
            is_enabled=True,
            is_access_controlled=True,
            is_assignable=True,
        ).order_by("position", "name")
        payload = [
            {"id": application.id, "key": application.key, "name": application.name}
            for application in applications
        ]
        return Response(AvailableApplicationSerializer(payload, many=True).data)


class ApplicationGroupDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_group(self, group_id: int):
        return get_object_or_404(
            Group.objects.prefetch_related("allowed_applications", "user_set"),
            pk=group_id,
        )

    @extend_schema(
        operation_id="utilizatori_group_retrieve",
        responses={200: ApplicationGroupSerializer, 404: ApiErrorSerializer},
        summary="Returnează un grup",
        tags=["utilizatori"],
    )
    def get(self, request, group_id: int):
        return Response(ApplicationGroupSerializer(self.get_group(group_id)).data)

    @extend_schema(
        operation_id="utilizatori_group_update",
        request=ApplicationGroupWriteSerializer,
        responses={200: ApplicationGroupSerializer, 400: ApiErrorSerializer},
        summary="Actualizează un grup și relațiile sale",
        tags=["utilizatori"],
    )
    def patch(self, request, group_id: int):
        group = self.get_group(group_id)
        serializer = ApplicationGroupWriteSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        with transaction.atomic():
            if "name" in values:
                group.name = values["name"]
                group.save(update_fields=("name",))
            if "application_ids" in values:
                group.allowed_applications.set(values["application_ids"])
            if "user_ids" in values:
                group.user_set.set(values["user_ids"])
        return Response(ApplicationGroupSerializer(self.get_group(group_id)).data)

    @extend_schema(
        operation_id="utilizatori_group_delete",
        responses={204: None, 404: ApiErrorSerializer},
        summary="Șterge un grup",
        tags=["utilizatori"],
    )
    def delete(self, request, group_id: int):
        self.get_group(group_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
