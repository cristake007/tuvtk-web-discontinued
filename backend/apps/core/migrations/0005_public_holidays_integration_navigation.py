from django.db import migrations


def add_public_holidays_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    application, _ = ApplicationDefinition.objects.update_or_create(
        key="public-holidays",
        defaults={
            "name": "Zile sărbătoare",
            "description": "Integrarea Nager.Date și zilele interne nelucrătoare.",
            "route_prefix": "/settings/integrations",
            "position": 80,
            "is_enabled": True,
        },
    )
    settings_item = NavigationItem.objects.get(key="settings")
    NavigationItem.objects.update_or_create(
        key="settings-integrations",
        defaults={
            "application": application,
            "label": "Integrări",
            "path": "/settings/integrations",
            "icon": "plug",
            "position": 10,
            "parent": settings_item,
            "permission_code": "",
            "requires_staff": True,
            "is_enabled": True,
        },
    )


def remove_public_holidays_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="settings-integrations").delete()
    ApplicationDefinition.objects.filter(key="public-holidays").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_course_planner_navigation"),
        ("public_holidays", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            add_public_holidays_navigation,
            remove_public_holidays_navigation,
        ),
    ]
