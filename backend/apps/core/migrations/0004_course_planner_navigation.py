from django.db import migrations


def add_course_planner_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    application, _ = ApplicationDefinition.objects.update_or_create(
        key="course-planner",
        defaults={
            "name": "Planificator cursuri",
            "description": "Generarea și exportul perioadelor pentru cursuri.",
            "route_prefix": "/planificator-cursuri",
            "position": 40,
            "is_enabled": True,
        },
    )
    NavigationItem.objects.update_or_create(
        key="course-planner",
        defaults={
            "application": application,
            "label": "Planificator cursuri",
            "path": "/planificator-cursuri",
            "icon": "calendar-range",
            "position": 40,
            "parent": None,
            "permission_code": "",
            "requires_staff": False,
            "is_enabled": True,
        },
    )


def remove_course_planner_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="course-planner").delete()
    ApplicationDefinition.objects.filter(key="course-planner").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_localize_navigation_labels"),
        ("course_planner", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            add_course_planner_navigation,
            remove_course_planner_navigation,
        ),
    ]
