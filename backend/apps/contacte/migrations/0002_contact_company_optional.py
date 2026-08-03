import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("contacte", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="contact",
            name="company",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="contacts",
                to="companii.companie",
            ),
        ),
    ]
