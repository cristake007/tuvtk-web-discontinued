from django.contrib import admin

from .models import CoursePlannerSettings


@admin.register(CoursePlannerSettings)
class CoursePlannerSettingsAdmin(admin.ModelAdmin):
    list_display = ("year", "randomness", "updated_at")
    readonly_fields = ("updated_at",)
