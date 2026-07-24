from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AuthenticationEndpointsSerializer,
    AuthenticationSessionSerializer,
    ErrorDetailSerializer,
    LoginRequestSerializer,
)
from .services import serialize_authentication_session


@method_decorator(never_cache, name="dispatch")
class AuthenticationRootView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="authentication_root",
        responses=AuthenticationEndpointsSerializer,
        summary="Return authentication API endpoints",
        tags=["authentication"],
    )
    def get(self, request):
        payload = {
            "csrf": "/api/v1/auth/csrf",
            "session": "/api/v1/auth/session",
            "login": "/api/v1/auth/login",
            "logout": "/api/v1/auth/logout",
        }
        return Response(AuthenticationEndpointsSerializer(payload).data)


@method_decorator(never_cache, name="dispatch")
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="authentication_csrf",
        responses={204: None},
        summary="Set the Django CSRF cookie",
        tags=["authentication"],
    )
    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(never_cache, name="dispatch")
class SessionView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="authentication_session",
        responses=AuthenticationSessionSerializer,
        summary="Return the current browser session state",
        tags=["authentication"],
    )
    def get(self, request):
        payload = serialize_authentication_session(request.user)
        return Response(AuthenticationSessionSerializer(payload).data)


@method_decorator(never_cache, name="dispatch")
@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="authentication_login",
        request=LoginRequestSerializer,
        responses={
            200: AuthenticationSessionSerializer,
            401: ErrorDetailSerializer,
        },
        summary="Create a Django login session",
        tags=["authentication"],
    )
    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )

        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        django_login(request, user)
        payload = serialize_authentication_session(user)
        return Response(AuthenticationSessionSerializer(payload).data)


@method_decorator(never_cache, name="dispatch")
@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="authentication_logout",
        request=None,
        responses={204: None},
        summary="End the current Django login session",
        tags=["authentication"],
    )
    def post(self, request):
        django_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
