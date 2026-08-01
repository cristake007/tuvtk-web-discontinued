from django.contrib import admin

from .models import SafeCourseDateUpdaterSettings


@admin.register(SafeCourseDateUpdaterSettings)
class SafeCourseDateUpdaterSettingsAdmin(admin.ModelAdmin):
    list_display = ("wp_base_url", "wp_username", "updated_at")
    readonly_fields = ("updated_at",)
