from django.urls import path

from .views import (
    AuthenticationRootView,
    CsrfCookieView,
    LoginView,
    LogoutView,
    SessionView,
)

app_name = "authentication-api"

urlpatterns = [
    path("", AuthenticationRootView.as_view(), name="root"),
    path("csrf", CsrfCookieView.as_view(), name="csrf"),
    path("session", SessionView.as_view(), name="session"),
    path("login", LoginView.as_view(), name="login"),
    path("logout", LogoutView.as_view(), name="logout"),
]
