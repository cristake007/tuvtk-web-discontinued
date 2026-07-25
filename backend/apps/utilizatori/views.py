from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from config.error_serializers import ApiErrorSerializer

from .serializers import (
    UserAccountSerializer,
    UserListResponseSerializer,
    UserQuerySerializer,
    UserWriteSerializer,
)


class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class UserCollectionView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="utilizatori_list",
        parameters=[UserQuerySerializer],
        responses={200: UserListResponseSerializer, 403: ApiErrorSerializer},
        summary="List and filter platform users",
        tags=["utilizatori"],
    )
    def get(self, request):
        query_serializer = UserQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        values = query_serializer.validated_data

        queryset = get_user_model().objects.all()
        search = values.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        status_filter = values.get("status", "all")
        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)

        role_filter = values.get("role", "all")
        if role_filter == "staff":
            queryset = queryset.filter(is_staff=True)
        elif role_filter == "user":
            queryset = queryset.filter(is_staff=False)

        queryset = queryset.order_by("-is_active", "last_name", "first_name", "username")
        paginator = UserPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = UserAccountSerializer(page, many=True)
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
        user = serializer.save()
        return Response(UserAccountSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_user(self, user_id: int):
        return get_object_or_404(get_user_model(), pk=user_id)

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
        return Response(UserAccountSerializer(self.get_user(user_id)).data)

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
        user = serializer.save()
        return Response(UserAccountSerializer(user).data)
