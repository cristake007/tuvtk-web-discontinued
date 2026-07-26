from django.db import migrations


def ascunde_administrarea_din_navigatie(apps, schema_editor):
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="administration").update(is_enabled=False)


def restaureaza_administrarea_in_navigatie(apps, schema_editor):
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key="administration").update(is_enabled=True)


class Migration(migrations.Migration):
    dependencies = [("core", "0011_navigatie_aplicatii_viitoare")]

    operations = [
        migrations.RunPython(
            ascunde_administrarea_din_navigatie,
            restaureaza_administrarea_in_navigatie,
        )
    ]
