from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework.authentication import SessionAuthentication


class BrowserSessionAuthentication(SessionAuthentication):
    """Django session authentication with a proper 401 challenge for the SPA."""

    def authenticate_header(self, request):
        return "Session"


class BrowserSessionAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.BrowserSessionAuthentication"
    name = "cookieAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "sessionid",
            "description": "Django browser session cookie.",
        }
