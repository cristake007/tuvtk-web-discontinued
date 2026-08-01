from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0012_muta_administrarea_in_meniul_utilizatorului")]

    operations = [
        migrations.AddField(
            model_name="applicationconfiguration",
            name="culoare_primara",
            field=models.CharField(default="#164194", max_length=7),
        ),
        migrations.AddField(
            model_name="applicationconfiguration",
            name="culoare_accent",
            field=models.CharField(default="#d41131", max_length=7),
        ),
        migrations.AddField(
            model_name="applicationconfiguration",
            name="culoare_fundal",
            field=models.CharField(default="#ffffff", max_length=7),
        ),
    ]
