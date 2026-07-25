from django.db import migrations


def use_course_planner_catalog_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    ApplicationDefinition.objects.filter(key="course-planner").update(
        description="Instrumente pentru planificarea și procesarea datelor cursurilor."
    )
    NavigationItem.objects.filter(key="course-planner-history").delete()


def restore_course_planner_history_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    application = ApplicationDefinition.objects.get(key="course-planner")
    ApplicationDefinition.objects.filter(key="course-planner").update(
        description="Generarea și exportul perioadelor pentru cursuri."
    )
    parent = NavigationItem.objects.get(key="course-planner")
    NavigationItem.objects.update_or_create(
        key="course-planner-history",
        defaults={
            "application": application,
            "label": "Istoric",
            "path": "/planificator-cursuri/istoric",
            "icon": "history",
            "position": 20,
            "parent": parent,
            "permission_code": "",
            "requires_staff": False,
            "is_enabled": True,
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0006_public_holidays_integration_navigation"),
    ]

    operations = [
        migrations.RunPython(
            use_course_planner_catalog_navigation,
            restore_course_planner_history_navigation,
        ),
    ]
