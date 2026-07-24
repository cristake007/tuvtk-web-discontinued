from rest_framework.authentication import SessionAuthentication


class BrowserSessionAuthentication(SessionAuthentication):
    """Django session authentication with a proper 401 challenge for the SPA."""

    def authenticate_header(self, request):
        return "Session"
