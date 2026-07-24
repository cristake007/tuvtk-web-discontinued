from django.db import migrations, models
import django.db.models.deletion


APPLICATIONS = (
    {
        "key": "core",
        "name": "Core",
        "description": "Application shell, settings, navigation, and shared configuration.",
        "route_prefix": "/",
        "position": 10,
    },
    {
        "key": "companies",
        "name": "Companies",
        "description": "Company directory and registry workflows.",
        "route_prefix": "/companies",
        "position": 20,
    },
    {
        "key": "documents",
        "name": "Documents",
        "description": "Document creation and management workflows.",
        "route_prefix": "/documents",
        "position": 30,
    },
)


def seed_application_definitions(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    definitions = {}
    for definition in APPLICATIONS:
        application, _ = ApplicationDefinition.objects.update_or_create(
            key=definition["key"],
            defaults={
                "name": definition["name"],
                "description": definition["description"],
                "route_prefix": definition["route_prefix"],
                "position": definition["position"],
                "is_enabled": True,
            },
        )
        definitions[definition["key"]] = application

    NavigationItem.objects.filter(key__in=("dashboard", "settings")).update(
        application=definitions["core"]
    )
    NavigationItem.objects.filter(key="companies").update(
        application=definitions["companies"]
    )
    NavigationItem.objects.filter(key="documents").update(
        application=definitions["documents"]
    )
    NavigationItem.objects.filter(application__isnull=True).update(
        application=definitions["core"]
    )


def remove_application_definitions(apps, schema_editor):
    ApplicationDefinition = apps.get_model("core", "ApplicationDefinition")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.update(application=None)
    ApplicationDefinition.objects.filter(
        key__in=tuple(definition["key"] for definition in APPLICATIONS)
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationDefinition",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("key", models.SlugField(max_length=80, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True)),
                ("route_prefix", models.CharField(blank=True, max_length=240)),
                ("position", models.PositiveIntegerField(default=0)),
                ("is_enabled", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "application definition",
                "verbose_name_plural": "application definitions",
                "ordering": ("position", "name"),
            },
        ),
        migrations.AddField(
            model_name="applicationconfiguration",
            name="company_logo_svg",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="navigationitem",
            name="application",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="navigation_items",
                to="core.applicationdefinition",
            ),
        ),
        migrations.RunPython(
            seed_application_definitions,
            remove_application_definitions,
        ),
        migrations.AlterField(
            model_name="navigationitem",
            name="application",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="navigation_items",
                to="core.applicationdefinition",
            ),
        ),
    ]
