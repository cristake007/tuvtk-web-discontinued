from django.urls import path

from .views import CsrfCookieView, LoginView, LogoutView, SessionView

app_name = "accounts-api"

urlpatterns = [
    path("csrf", CsrfCookieView.as_view(), name="csrf"),
    path("session", SessionView.as_view(), name="session"),
    path("login", LoginView.as_view(), name="login"),
    path("logout", LogoutView.as_view(), name="logout"),
]
