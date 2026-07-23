# backend/apps/core/views.py
from django.http import HttpResponse


def index(request):
    return HttpResponse(
        "<h1 style='color:black;background:white'>Core app works</h1>"
    )