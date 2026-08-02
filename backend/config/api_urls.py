from django.http import HttpRequest, JsonResponse
from django.urls import include, path
from django.views.decorators.cache import never_cache

from apps.authentication.services import get_authentication_endpoints

from .api_views import HealthView

app_name = "api-v1"


@never_cache
def authentication_root(request: HttpRequest) -> JsonResponse:
    return JsonResponse(get_authentication_endpoints())


urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("auth", authentication_root, name="authentication-root-no-slash"),
    path("auth/", include("apps.authentication.urls")),
    path("core/", include("apps.core.urls")),
    path("tablou-de-bord/", include("apps.tablou_de_bord.urls")),
    path("documente/", include("apps.documente.urls")),
    path("course-planner/", include("apps.course_planner.urls")),
    path("update-wordpress/", include("apps.update_wordpress.urls")),
    path("utilizatori/", include("apps.utilizatori.urls")),
    path("companii/", include("apps.companii.urls")),
    path(
        "integrations/public-holidays/",
        include("apps.public_holidays.urls"),
    ),
]
