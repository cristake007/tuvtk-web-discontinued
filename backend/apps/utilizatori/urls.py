from django.urls import path

from .views import UserCollectionView, UserDetailView

app_name = "utilizatori"

urlpatterns = [
    path("", UserCollectionView.as_view(), name="list-create"),
    path("<int:user_id>", UserDetailView.as_view(), name="detail"),
]
