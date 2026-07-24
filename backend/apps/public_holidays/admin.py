from django.contrib import admin

from .models import PublicHoliday, PublicHolidaySettings


@admin.register(PublicHoliday)
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = (
        "date",
        "local_name",
        "source",
        "is_internal",
        "synced_at",
    )
    list_filter = ("source", "is_internal", "date")
    search_fields = ("local_name", "english_name", "description")
    ordering = ("date", "local_name")
    readonly_fields = ("created_at", "updated_at", "synced_at")


@admin.register(PublicHolidaySettings)
class PublicHolidaySettingsAdmin(admin.ModelAdmin):
    list_display = (
        "enabled",
        "automatic_sync",
        "frequency",
        "last_status",
        "next_sync_at",
    )
    readonly_fields = (
        "last_attempted_at",
        "last_successful_at",
        "next_sync_at",
        "last_status",
        "last_error",
        "last_accepted_count",
        "last_created_count",
        "last_updated_count",
        "last_removed_count",
        "sync_in_progress",
        "sync_lock_acquired_at",
        "updated_at",
    )
