from django.urls import path

from .views import (
    ApplicationGroupCollectionView,
    ApplicationGroupDetailView,
    AvailableApplicationCollectionView,
    UserCollectionView,
    UserDetailView,
)

app_name = "utilizatori"

urlpatterns = [
    path("", UserCollectionView.as_view(), name="list-create"),
    path("grupuri", ApplicationGroupCollectionView.as_view(), name="group-list-create"),
    path(
        "grupuri/aplicatii",
        AvailableApplicationCollectionView.as_view(),
        name="group-available-applications",
    ),
    path("grupuri/<int:group_id>", ApplicationGroupDetailView.as_view(), name="group-detail"),
    path("<int:user_id>", UserDetailView.as_view(), name="detail"),
]
