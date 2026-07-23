# backend/apps/core/views.py
from django.http import HttpResponse


def index(request):
    return HttpResponse(
        "Core app works test live reload"
    )