from django.urls import path

from .views import RezumatTablouDeBordView

app_name = "tablou-de-bord"

urlpatterns = [
    path("rezumat", RezumatTablouDeBordView.as_view(), name="rezumat"),
]
