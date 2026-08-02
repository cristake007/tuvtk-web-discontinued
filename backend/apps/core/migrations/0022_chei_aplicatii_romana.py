from django.db import migrations


def rename_application_keys(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    ApplicationDefinition.objects.filter(key="companies").update(key="companii")
    ApplicationDefinition.objects.filter(key="documents").update(key="documente")
    ApplicationDefinition.objects.filter(key="course-planner").update(
        key="planificator-cursuri"
    )
    ApplicationDefinition.objects.filter(key="training").update(key="instruiri")
    ApplicationDefinition.objects.filter(key="public-holidays").update(key="zile-libere")


def reverse_rename_application_keys(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    ApplicationDefinition.objects.filter(key="zile-libere").update(key="public-holidays")
    ApplicationDefinition.objects.filter(key="instruiri").update(key="training")
    ApplicationDefinition.objects.filter(key="planificator-cursuri").update(
        key="course-planner"
    )
    ApplicationDefinition.objects.filter(key="documente").update(key="documents")
    ApplicationDefinition.objects.filter(key="companii").update(key="companies")


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0021_applicationconfiguration_font_scale"),
    ]

    operations = [
        migrations.RunPython(rename_application_keys, reverse_rename_application_keys),
    ]
