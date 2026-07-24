from django.urls import include, path

from .api_views import HealthView

app_name = "api-v1"

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("auth/", include("apps.accounts.urls")),
    path("core/", include("apps.core.urls")),
]
