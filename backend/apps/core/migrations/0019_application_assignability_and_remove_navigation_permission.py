from django.db import migrations, models


def mark_navigation_containers_unassignable(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    ApplicationDefinition.objects.filter(
        key__in=("core", "crm", "public-holidays")
    ).update(is_assignable=False)


class Migration(migrations.Migration):
    dependencies = [("core", "0018_application_user_access")]

    operations = [
        migrations.AddField(
            model_name="applicationdefinition",
            name="is_assignable",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(mark_navigation_containers_unassignable, migrations.RunPython.noop),
        migrations.RemoveField(model_name="navigationitem", name="permission_code"),
    ]
