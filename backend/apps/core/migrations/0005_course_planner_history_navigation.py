from django.db import migrations


def add_course_planner_history_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    application = ApplicationDefinition.objects.get(key="course-planner")
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


def remove_course_planner_history_navigation(apps, schema_editor):
    NavigationItem = apps.get_model("core", "NavigationItem")
    NavigationItem.objects.filter(key="course-planner-history").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_course_planner_navigation"),
        ("course_planner", "0002_courseplangeneration"),
    ]

    operations = [
        migrations.RunPython(
            add_course_planner_history_navigation,
            remove_course_planner_history_navigation,
        ),
    ]
