from django.db import migrations


def use_administration_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="settings-integrations").delete()
    NavigationItem.objects.filter(key="settings").update(
        key="administration",
        label="Administrare",
        path="/administrare",
        icon="settings",
    )
    ApplicationDefinition.objects.filter(key="public-holidays").update(
        route_prefix="/administrare/integrari"
    )


def restore_settings_navigation(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="administration").update(
        key="settings",
        label="Setări",
        path="/settings",
        icon="settings",
    )
    ApplicationDefinition.objects.filter(key="public-holidays").update(
        route_prefix="/settings/integrations"
    )

    application = ApplicationDefinition.objects.get(key="public-holidays")
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


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_course_planner_catalog_navigation"),
    ]

    operations = [
        migrations.RunPython(
            use_administration_navigation,
            restore_settings_navigation,
        ),
    ]
