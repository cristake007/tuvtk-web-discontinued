from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0017_application_group_access"),
    ]

    operations = [
        migrations.AddField(
            model_name="applicationdefinition",
            name="allowed_users",
            field=models.ManyToManyField(
                blank=True,
                related_name="directly_allowed_applications",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
