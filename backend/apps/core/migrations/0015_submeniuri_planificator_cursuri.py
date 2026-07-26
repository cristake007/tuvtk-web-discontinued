from django.db import migrations


SUBMENIURI = (
    (
        "course-planner-generator",
        "Generare perioade",
        "/planificator-cursuri/generator",
        "calendar-range",
        10,
    ),
    (
        "course-planner-history",
        "Istoric generări",
        "/planificator-cursuri/istoric",
        "history",
        20,
    ),
    (
        "course-planner-xml",
        "XML cursuri",
        "/planificator-cursuri/xml",
        "file-code-2",
        30,
    ),
    (
        "course-planner-word-matcher",
        "Potrivire Word",
        "/planificator-cursuri/word-matcher",
        "scan-text",
        40,
    ),
)


def configureaza_submeniurile(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    aplicatie = ApplicationDefinition.objects.get(key="course-planner")
    parinte = NavigationItem.objects.get(key="course-planner")
    for cheie, eticheta, cale, pictograma, pozitie in SUBMENIURI:
        NavigationItem.objects.update_or_create(
            key=cheie,
            defaults={
                "application": aplicatie,
                "label": eticheta,
                "path": cale,
                "icon": pictograma,
                "position": pozitie,
                "parent": parinte,
                "permission_code": "",
                "requires_staff": False,
                "is_enabled": True,
                "is_separator": False,
            },
        )


def elimina_submeniurile(apps, schema_editor):
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key__in=tuple(element[0] for element in SUBMENIURI)).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0014_separatoare_meniu")]

    operations = [
        migrations.RunPython(configureaza_submeniurile, elimina_submeniurile)
    ]
