from django.urls import path

from .views import CompanyLogoSettingsView, CompanyLogoView, CoreBootstrapView

app_name = "core-api"

urlpatterns = [
    path("bootstrap", CoreBootstrapView.as_view(), name="bootstrap"),
    path("company-logo", CompanyLogoView.as_view(), name="company-logo"),
    path(
        "settings/company-logo",
        CompanyLogoSettingsView.as_view(),
        name="company-logo-settings",
    ),
]
