from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import CompanyListView, ContactViewSet, OwnerListView

router = SimpleRouter()
router.register("", ContactViewSet, basename="contact")

app_name = "contacte"
urlpatterns = [
    path("owners/", OwnerListView.as_view(), name="owners"),
    path("companies/", CompanyListView.as_view(), name="companies"),
    path("", include(router.urls)),
]
