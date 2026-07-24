from django.contrib import admin

from .models import ApplicationConfiguration, NavigationItem


@admin.register(ApplicationConfiguration)
class ApplicationConfigurationAdmin(admin.ModelAdmin):
    list_display = ("site_name", "organization_name", "is_active", "updated_at")
    list_filter = ("is_active",)


@admin.register(NavigationItem)
class NavigationItemAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "key",
        "path",
        "parent",
        "position",
        "is_enabled",
        "requires_staff",
    )
    list_filter = ("is_enabled", "requires_staff")
    list_editable = ("position", "is_enabled")
    search_fields = ("label", "key", "path", "permission_code")
