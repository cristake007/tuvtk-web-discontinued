from django.urls import path

from .views import CoursePlannerSettingsView, ExportScheduleView, GenerateScheduleView

app_name = "course-planner"

urlpatterns = [
    path("settings", CoursePlannerSettingsView.as_view(), name="settings"),
    path("generate", GenerateScheduleView.as_view(), name="generate"),
    path("export", ExportScheduleView.as_view(), name="export"),
]
