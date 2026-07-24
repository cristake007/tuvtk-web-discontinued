from django.db import migrations


ROMANIAN_LABELS = {
    "dashboard": "Dashboard",
    "companies": "Companii",
    "documents": "Documente",
    "settings": "Setări",
}

ENGLISH_LABELS = {
    "dashboard": "Dashboard",
    "companies": "Companies",
    "documents": "Documents",
    "settings": "Settings",
}


def update_navigation_labels(apps, labels, sidebar_title):
    ApplicationConfiguration = apps.get_model("core", "ApplicationConfiguration")
    NavigationItem = apps.get_model("core", "NavigationItem")

    for key, label in labels.items():
        NavigationItem.objects.filter(key=key).update(label=label)

    ApplicationConfiguration.objects.filter(is_active=True).update(
        sidebar_title=sidebar_title
    )


def localize_navigation_labels(apps, schema_editor):
    update_navigation_labels(apps, ROMANIAN_LABELS, "Navigație")


def restore_navigation_labels(apps, schema_editor):
    update_navigation_labels(apps, ENGLISH_LABELS, "Workspace")


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_application_definitions_company_logo"),
    ]

    operations = [
        migrations.RunPython(
            localize_navigation_labels,
            restore_navigation_labels,
        ),
    ]
