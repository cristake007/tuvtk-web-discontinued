from django.urls import include, path

from apps.authentication.views import AuthenticationRootView

from .api_views import HealthView

app_name = "api-v1"

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("auth", AuthenticationRootView.as_view(), name="authentication-root"),
    path("auth/", include("apps.authentication.urls")),
    path("core/", include("apps.core.urls")),
]
