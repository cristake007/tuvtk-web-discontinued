from django.contrib import admin

from .models import CoursePlanGeneration, CoursePlannerSettings


@admin.register(CoursePlannerSettings)
class CoursePlannerSettingsAdmin(admin.ModelAdmin):
    list_display = ("year", "randomness", "updated_at")
    readonly_fields = ("updated_at",)


@admin.register(CoursePlanGeneration)
class CoursePlanGenerationAdmin(admin.ModelAdmin):
    list_display = (
        "source_filename",
        "year",
        "course_count",
        "created_by",
        "created_at",
    )
    list_filter = ("year", "created_at")
    search_fields = ("source_filename", "created_by__username")
    readonly_fields = (
        "id",
        "created_by",
        "source_filename",
        "year",
        "months",
        "randomness",
        "holidays",
        "course_count",
        "schedule",
        "excel_file",
        "word_file",
        "xml_file",
        "created_at",
        "updated_at",
    )
