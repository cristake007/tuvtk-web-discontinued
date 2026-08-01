from django.db import migrations


def configureaza_navigatia(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    tablou_de_bord, _ = ApplicationDefinition.objects.update_or_create(
        key="tablou-de-bord",
        defaults={
            "name": "Tablou de bord",
            "description": "Punctul de plecare pentru activitatea din platformă.",
            "route_prefix": "/tablou-de-bord",
            "position": 10,
            "is_enabled": True,
        },
    )
    NavigationItem.objects.filter(key="dashboard").update(
        application=tablou_de_bord,
        path="/tablou-de-bord",
    )
    ApplicationDefinition.objects.filter(key="documents").update(
        name="Documente",
        description="Spațiul pentru pregătirea, organizarea și consultarea documentelor.",
        route_prefix="/documente",
    )
    NavigationItem.objects.filter(key="documents").update(path="/documente")


def restaureaza_navigatia(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    core = ApplicationDefinition.objects.get(key="core")
    NavigationItem.objects.filter(key="dashboard").update(application=core, path="/")
    ApplicationDefinition.objects.filter(key="documents").update(
        name="Documents",
        description="Document creation and management workflows.",
        route_prefix="/documents",
    )
    NavigationItem.objects.filter(key="documents").update(path="/documents")
    ApplicationDefinition.objects.filter(key="tablou-de-bord").delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0008_administration_navigation")]

    operations = [migrations.RunPython(configureaza_navigatia, restaureaza_navigatia)]
