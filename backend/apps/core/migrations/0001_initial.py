from django.db import migrations, models
import django.db.models.deletion


def seed_application_shell(apps, schema_editor):
    ApplicationConfiguration = apps.get_model("core", "ApplicationConfiguration")
    NavigationItem = apps.get_model("core", "NavigationItem")

    ApplicationConfiguration.objects.create(
        site_name="TUVTK",
        organization_name="TÜV Thüringen Karpat",
        sidebar_title="Workspace",
        is_active=True,
    )

    NavigationItem.objects.bulk_create(
        [
            NavigationItem(
                key="dashboard",
                label="Dashboard",
                path="/",
                icon="layout-dashboard",
                position=10,
            ),
            NavigationItem(
                key="companies",
                label="Companies",
                path="/companies",
                icon="building-2",
                position=20,
            ),
            NavigationItem(
                key="documents",
                label="Documents",
                path="/documents",
                icon="files",
                position=30,
            ),
            NavigationItem(
                key="settings",
                label="Settings",
                path="/settings",
                icon="settings",
                position=90,
                requires_staff=True,
            ),
        ]
    )


def remove_application_shell(apps, schema_editor):
    ApplicationConfiguration = apps.get_model("core", "ApplicationConfiguration")
    NavigationItem = apps.get_model("core", "NavigationItem")

    NavigationItem.objects.filter(
        key__in=("dashboard", "companies", "documents", "settings")
    ).delete()
    ApplicationConfiguration.objects.filter(site_name="TUVTK").delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ApplicationConfiguration",
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
                ("site_name", models.CharField(default="TUVTK", max_length=120)),
                (
                    "organization_name",
                    models.CharField(
                        default="TÜV Thüringen Karpat",
                        max_length=180,
                    ),
                ),
                (
                    "sidebar_title",
                    models.CharField(default="Workspace", max_length=120),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "application configuration",
                "verbose_name_plural": "application configurations",
            },
        ),
        migrations.CreateModel(
            name="NavigationItem",
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
                ("label", models.CharField(max_length=120)),
                ("path", models.CharField(max_length=240)),
                ("icon", models.CharField(blank=True, max_length=80)),
                ("position", models.PositiveIntegerField(default=0)),
                ("permission_code", models.CharField(blank=True, max_length=160)),
                ("requires_staff", models.BooleanField(default=False)),
                ("is_enabled", models.BooleanField(default=True)),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="children",
                        to="core.navigationitem",
                    ),
                ),
            ],
            options={"ordering": ("position", "label")},
        ),
        migrations.RunPython(seed_application_shell, remove_application_shell),
    ]
