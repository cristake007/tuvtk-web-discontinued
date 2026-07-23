from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path

from config.api import api


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", api.urls),
]

urlpatterns += staticfiles_urlpatterns()
