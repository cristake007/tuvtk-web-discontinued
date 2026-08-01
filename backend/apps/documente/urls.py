from django.urls import path

from .views import RezumatDocumenteView

app_name = "documente"

urlpatterns = [
    path("rezumat", RezumatDocumenteView.as_view(), name="rezumat"),
]
