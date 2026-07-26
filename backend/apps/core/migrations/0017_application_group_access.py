from django.conf import settings
from django.db import migrations, models


def configure_initial_access(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    ApplicationDefinition.objects.filter(key__in=("core", "public-holidays")).update(
        is_access_controlled=False
    )

    legacy_companies = ApplicationDefinition.objects.filter(key="companii").first()
    companies = ApplicationDefinition.objects.filter(key="companies").first()
    if legacy_companies and companies:
        NavigationItem.objects.filter(application=legacy_companies).update(
            application=companies
        )
        legacy_companies.delete()
    elif legacy_companies:
        legacy_companies.key = "companies"
        legacy_companies.save(update_fields=("key", "updated_at"))


def restore_legacy_companies_key(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    ApplicationDefinition.objects.filter(key="companies").update(key="companii")
    ApplicationDefinition.objects.filter(key__in=("core", "public-holidays")).update(
        is_access_controlled=True
    )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0016_update_wordpress_navigation"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationdefinition",
            name="allowed_groups",
            field=models.ManyToManyField(
                blank=True,
                related_name="allowed_applications",
                to="auth.group",
            ),
        ),
        migrations.AddField(
            model_name="applicationdefinition",
            name="is_access_controlled",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(configure_initial_access, restore_legacy_companies_key),
    ]
