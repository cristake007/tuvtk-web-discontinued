from django.db import migrations


APLICATII = (
    (
        "training",
        "Training",
        "Instrumente pentru activitățile de formare.",
        "/training",
        40,
        "graduation-cap",
    ),
    (
        "certificari",
        "Certificări",
        "Instrumente pentru activitățile de certificare.",
        "/certificari",
        50,
        "badge-check",
    ),
    (
        "industrial",
        "Industrial",
        "Instrumente pentru activitățile industriale.",
        "/industrial",
        60,
        "factory",
    ),
)


def configureaza_aplicatiile_viitoare(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    for cheie, nume, descriere, cale, pozitie, pictograma in APLICATII:
        aplicatie, _ = ApplicationDefinition.objects.update_or_create(
            key=cheie,
            defaults={
                "name": nume,
                "description": descriere,
                "route_prefix": cale,
                "position": pozitie,
                "is_enabled": True,
            },
        )
        parinte, _ = NavigationItem.objects.update_or_create(
            key=cheie,
            defaults={
                "application": aplicatie,
                "label": nume,
                "path": cale,
                "icon": pictograma,
                "position": pozitie,
                "parent": None,
                "permission_code": "",
                "requires_staff": False,
                "is_enabled": True,
            },
        )
        NavigationItem.objects.update_or_create(
            key=f"{cheie}-in-pregatire",
            defaults={
                "application": aplicatie,
                "label": "În pregătire",
                "path": f"{cale}/in-pregatire",
                "icon": "circle",
                "position": 10,
                "parent": parinte,
                "permission_code": "",
                "requires_staff": False,
                "is_enabled": True,
            },
        )


def restaureaza_aplicatiile_viitoare(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    chei = tuple(element[0] for element in APLICATII)
    NavigationItem.objects.filter(
        key__in=tuple(f"{cheie}-in-pregatire" for cheie in chei)
    ).delete()
    NavigationItem.objects.filter(key__in=chei).delete()
    ApplicationDefinition.objects.filter(key__in=chei).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0010_navigatie_crm")]

    operations = [
        migrations.RunPython(
            configureaza_aplicatiile_viitoare,
            restaureaza_aplicatiile_viitoare,
        )
    ]
