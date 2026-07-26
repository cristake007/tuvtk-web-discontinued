from django.db import migrations


def configureaza_navigatia_crm(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    crm, _ = ApplicationDefinition.objects.update_or_create(
        key="crm",
        defaults={
            "name": "CRM",
            "description": "Gestionarea relațiilor cu clienții.",
            "route_prefix": "/crm",
            "position": 20,
            "is_enabled": True,
        },
    )
    parinte_crm, _ = NavigationItem.objects.update_or_create(
        key="crm",
        defaults={
            "application": crm,
            "label": "CRM",
            "path": "/crm",
            "icon": "briefcase-business",
            "position": 20,
            "parent": None,
            "permission_code": "",
            "requires_staff": False,
            "is_enabled": True,
        },
    )

    companii = ApplicationDefinition.objects.get(key="companies")
    companii.key = "companii"
    companii.name = "Companii"
    companii.description = "Gestionarea companiilor și a datelor de identificare."
    companii.route_prefix = "/crm/companii"
    companii.position = 10
    companii.save(
        update_fields=("key", "name", "description", "route_prefix", "position", "updated_at")
    )
    NavigationItem.objects.filter(key="companies").update(
        key="companii",
        application=companii,
        label="Companii",
        path="/crm/companii",
        position=10,
        parent=parinte_crm,
    )

    aplicatii = (
        (
            "contacte",
            "Contacte",
            "Gestionarea persoanelor de contact asociate companiilor.",
            "/crm/contacte",
            20,
            "users",
        ),
        (
            "oportunitati",
            "Oportunități",
            "Urmărirea oportunităților comerciale și a etapelor lor.",
            "/crm/oportunitati",
            30,
            "target",
        ),
        (
            "activitati",
            "Activități",
            "Planificarea activităților și a urmăririlor comerciale.",
            "/crm/activitati",
            40,
            "list-checks",
        ),
    )
    for cheie, nume, descriere, cale, pozitie, pictograma in aplicatii:
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
        NavigationItem.objects.update_or_create(
            key=cheie,
            defaults={
                "application": aplicatie,
                "label": nume,
                "path": cale,
                "icon": pictograma,
                "position": pozitie,
                "parent": parinte_crm,
                "permission_code": "",
                "requires_staff": False,
                "is_enabled": True,
            },
        )


def restaureaza_navigatia_crm(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(key__in=("contacte", "oportunitati", "activitati")).delete()
    NavigationItem.objects.filter(key="companii").update(
        key="companies",
        label="Companii",
        path="/companies",
        position=20,
        parent=None,
    )
    companii = ApplicationDefinition.objects.get(key="companii")
    companii.key = "companies"
    companii.name = "Companies"
    companii.description = "Company directory and registry workflows."
    companii.route_prefix = "/companies"
    companii.position = 20
    companii.save(
        update_fields=("key", "name", "description", "route_prefix", "position", "updated_at")
    )
    ApplicationDefinition.objects.filter(key__in=("contacte", "oportunitati", "activitati")).delete()
    NavigationItem.objects.filter(key="crm").delete()
    ApplicationDefinition.objects.filter(key="crm").delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0009_tablou_de_bord_si_documente")]

    operations = [migrations.RunPython(configureaza_navigatia_crm, restaureaza_navigatia_crm)]
