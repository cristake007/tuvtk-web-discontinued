from django.http import JsonResponse


def csrf_failure(request, reason=""):
    return JsonResponse(
        {
            "code": "csrf_failed",
            "detail": "Tokenul de securitate lipsește sau nu mai este valid.",
            "fields": {},
        },
        status=403,
    )
