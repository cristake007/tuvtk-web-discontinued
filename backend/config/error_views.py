from django.http import JsonResponse
from django.views.defaults import page_not_found, server_error


def api_not_found(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "code": "not_found",
                "detail": "Resursa API solicitată nu există.",
                "fields": {},
            },
            status=404,
        )
    return page_not_found(request, exception)


def api_server_error(request):
    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "code": "server_error",
                "detail": "Serverul nu a putut procesa cererea.",
                "fields": {},
            },
            status=500,
        )
    return server_error(request)
