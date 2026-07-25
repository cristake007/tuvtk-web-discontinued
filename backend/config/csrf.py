from django.http import JsonResponse
from django.views.csrf import csrf_failure as django_csrf_failure


def csrf_failure(request, reason=""):
    if not request.path.startswith("/api/"):
        return django_csrf_failure(request, reason=reason)

    return JsonResponse(
        {
            "code": "csrf_failed",
            "detail": "Tokenul de securitate lipsește sau nu mai este valid.",
            "fields": {},
        },
        status=403,
    )
