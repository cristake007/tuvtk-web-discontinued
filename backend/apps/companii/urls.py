from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import CompanieViewSet, OwnerListView

router = SimpleRouter()
router.register("", CompanieViewSet, basename="companie")

app_name = "companii"
urlpatterns = [path("owners/", OwnerListView.as_view(), name="owners"), path("", include(router.urls))]
