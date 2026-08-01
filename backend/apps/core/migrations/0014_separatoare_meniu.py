from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0013_setari_interfata_utilizator")]

    operations = [
        migrations.AddField(
            model_name="navigationitem",
            name="is_separator",
            field=models.BooleanField(default=False),
        )
    ]
