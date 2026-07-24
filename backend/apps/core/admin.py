from django.contrib import admin

from .models import ApplicationConfiguration, ApplicationDefinition, NavigationItem


@admin.register(ApplicationDefinition)
class ApplicationDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "key", "route_prefix", "position", "is_enabled")
    list_filter = ("is_enabled",)
    list_editable = ("position", "is_enabled")
    search_fields = ("name", "key", "description", "route_prefix")


@admin.register(ApplicationConfiguration)
class ApplicationConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "site_name",
        "organization_name",
        "logo_configured",
        "is_active",
        "updated_at",
    )
    list_filter = ("is_active",)
    exclude = ("company_logo_svg",)

    @admin.display(boolean=True, description="Company logo")
    def logo_configured(self, obj: ApplicationConfiguration) -> bool:
        return bool(obj.company_logo_svg)


@admin.register(NavigationItem)
class NavigationItemAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "key",
        "application",
        "path",
        "parent",
        "position",
        "is_enabled",
        "requires_staff",
    )
    list_filter = ("application", "is_enabled", "requires_staff")
    list_editable = ("position", "is_enabled")
    search_fields = (
        "label",
        "key",
        "application__name",
        "application__key",
        "path",
        "permission_code",
    )
