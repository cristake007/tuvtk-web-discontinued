from django.urls import include, path
from django.views.generic import RedirectView

from .api_views import HealthView

app_name = "api-v1"

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path(
        "auth",
        RedirectView.as_view(url="/api/v1/auth/", permanent=False),
        name="authentication-root-redirect",
    ),
    path("auth/", include("apps.authentication.urls")),
    path("core/", include("apps.core.urls")),
]
