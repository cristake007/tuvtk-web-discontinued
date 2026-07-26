from django.urls import path

from .views import (
    CompanyLogoView,
    CoreBootstrapView,
    PublicBrandingView,
    UserInterfaceAdministrationView,
    UserInterfaceCompanyLogoView,
    UserInterfaceNavigationSeparatorView,
    UserInterfaceNavigationView,
)

app_name = "core-api"

urlpatterns = [
    path("branding", PublicBrandingView.as_view(), name="branding"),
    path("bootstrap", CoreBootstrapView.as_view(), name="bootstrap"),
    path("company-logo", CompanyLogoView.as_view(), name="company-logo"),
    path(
        "administration/user-interface",
        UserInterfaceAdministrationView.as_view(),
        name="administration-user-interface",
    ),
    path(
        "administration/user-interface/company-logo",
        UserInterfaceCompanyLogoView.as_view(),
        name="administration-user-interface-company-logo",
    ),
    path(
        "administration/user-interface/navigation",
        UserInterfaceNavigationView.as_view(),
        name="administration-user-interface-navigation",
    ),
    path(
        "administration/user-interface/navigation/separators/<slug:key>",
        UserInterfaceNavigationSeparatorView.as_view(),
        name="administration-user-interface-navigation-separator",
    ),
]
