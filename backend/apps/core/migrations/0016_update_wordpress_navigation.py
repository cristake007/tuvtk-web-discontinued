from django.db import migrations


def adauga_update_wordpress(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    aplicatie = ApplicationDefinition.objects.get(key="course-planner")
    parinte = NavigationItem.objects.get(key="course-planner")
    NavigationItem.objects.update_or_create(
        key="course-planner-update-wordpress",
        defaults={
            "application": aplicatie,
            "label": "Update WordPress",
            "path": "/planificator-cursuri/update-wordpress",
            "icon": "file-text",
            "position": 50,
            "parent": parinte,
            "permission_code": "",
            "requires_staff": False,
            "is_enabled": True,
            "is_separator": False,
        },
    )


def elimina_update_wordpress(apps, schema_editor):
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="course-planner-update-wordpress").delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0015_submeniuri_planificator_cursuri")]

    operations = [migrations.RunPython(adauga_update_wordpress, elimina_update_wordpress)]
