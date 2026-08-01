from django.urls import path

from .views import (
    CoursePlanFileDownloadView,
    CoursePlanHistoryView,
    CoursePlannerHolidaysView,
    CoursePlannerSettingsView,
    ExportScheduleView,
    FormatXmlView,
    GenerateScheduleView,
    WordMatchGenerateView,
    WordMatchPreviewView,
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
    path("format-xml", FormatXmlView.as_view(), name="format-xml"),
    path("word-match/preview", WordMatchPreviewView.as_view(), name="word-match-preview"),
    path("word-match/generate", WordMatchGenerateView.as_view(), name="word-match-generate"),
]
