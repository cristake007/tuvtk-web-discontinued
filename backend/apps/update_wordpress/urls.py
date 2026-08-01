from django.urls import path

from .views import (
    ConnectView,
    FetchCurrentDatesView,
    PreviewView,
    ResolvePostIdView,
    SafeCourseDateUpdaterSettingsView,
    UpdateRowView,
)

app_name = "update-wordpress"

urlpatterns = [
    path("settings", SafeCourseDateUpdaterSettingsView.as_view(), name="settings"),
    path("connect", ConnectView.as_view(), name="connect"),
    path("preview", PreviewView.as_view(), name="preview"),
    path("update-row", UpdateRowView.as_view(), name="update-row"),
    path("fetch-current-dates", FetchCurrentDatesView.as_view(), name="fetch-current-dates"),
    path("resolve-post-id", ResolvePostIdView.as_view(), name="resolve-post-id"),
]
