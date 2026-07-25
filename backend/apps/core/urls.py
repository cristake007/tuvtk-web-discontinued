from django.urls import path

from .views import (
    CompanyLogoAdministrationView,
    CompanyLogoView,
    CoreBootstrapView,
    PublicBrandingView,
)

app_name = "core-api"

urlpatterns = [
    path("branding", PublicBrandingView.as_view(), name="branding"),
    path("bootstrap", CoreBootstrapView.as_view(), name="bootstrap"),
    path("company-logo", CompanyLogoView.as_view(), name="company-logo"),
    path(
        "administration/company-logo",
        CompanyLogoAdministrationView.as_view(),
        name="administration-company-logo",
    ),
]
