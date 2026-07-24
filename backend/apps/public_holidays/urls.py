from django.urls import path

from .views import (
    InternalHolidayCreateView,
    InternalHolidayDetailView,
    PublicHolidayListView,
    PublicHolidaySettingsView,
    PublicHolidaySyncView,
)

app_name = "public-holidays"

urlpatterns = [
    path("holidays", PublicHolidayListView.as_view(), name="holiday-list"),
    path("settings", PublicHolidaySettingsView.as_view(), name="settings"),
    path("sync", PublicHolidaySyncView.as_view(), name="sync"),
    path("internal", InternalHolidayCreateView.as_view(), name="internal-create"),
    path(
        "internal/<uuid:holiday_id>",
        InternalHolidayDetailView.as_view(),
        name="internal-detail",
    ),
]
