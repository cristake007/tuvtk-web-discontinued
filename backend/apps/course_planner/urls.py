from django.urls import path

from .views import (
    CoursePlanFileDownloadView,
    CoursePlanHistoryView,
    CoursePlannerHolidaysView,
    CoursePlannerSettingsView,
    ExportScheduleView,
    GenerateScheduleView,
)

app_name = "course-planner"

urlpatterns = [
    path("settings", CoursePlannerSettingsView.as_view(), name="settings"),
    path("holidays", CoursePlannerHolidaysView.as_view(), name="holidays"),
    path("generate", GenerateScheduleView.as_view(), name="generate"),
    path("history", CoursePlanHistoryView.as_view(), name="history"),
    path(
        "history/<uuid:generation_id>/files/<str:file_type>",
        CoursePlanFileDownloadView.as_view(),
        name="history-file",
    ),
    path("export", ExportScheduleView.as_view(), name="export"),
]
