import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Companie",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(db_index=True, max_length=255, verbose_name="nume")),
                ("legal_name", models.CharField(blank=True, max_length=255, verbose_name="denumire juridică")),
                ("cui", models.CharField(blank=True, max_length=32, verbose_name="CUI")),
                ("trade_registry_number", models.CharField(blank=True, max_length=64, verbose_name="număr registrul comerțului")),
                ("vat_status", models.CharField(choices=[("TVA_PLATITOR", "Plătitor de TVA"), ("TVA_NEPLATITOR", "Neplătitor de TVA")], max_length=20, verbose_name="statut TVA")),
                ("status", models.CharField(choices=[("ACTIV", "Activ"), ("PROSPECT", "Prospect"), ("INACTIV", "Inactiv")], db_index=True, default="PROSPECT", max_length=20, verbose_name="statut")),
                ("website", models.URLField(blank=True, verbose_name="website")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="e-mail general")),
                ("phone", models.CharField(blank=True, max_length=64, verbose_name="telefon")),
                ("street", models.CharField(blank=True, max_length=255, verbose_name="stradă")),
                ("city", models.CharField(blank=True, max_length=128, verbose_name="localitate")),
                ("county", models.CharField(blank=True, max_length=128, verbose_name="județ")),
                ("postal_code", models.CharField(blank=True, max_length=20, verbose_name="cod poștal")),
                ("country", models.CharField(default="România", max_length=128, verbose_name="țară")),
                ("notes", models.TextField(blank=True, verbose_name="note interne")),
                ("is_archived", models.BooleanField(default=False)),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="owned_companies", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("name", "pk")},
        ),
        migrations.AddConstraint(model_name="companie", constraint=models.UniqueConstraint(condition=models.Q(("cui", ""), _negated=True), fields=("cui",), name="companii_unique_present_cui")),
        migrations.AddIndex(model_name="companie", index=models.Index(fields=["owner"], name="companii_owner_idx")),
        migrations.AddIndex(model_name="companie", index=models.Index(fields=["is_archived", "updated_at"], name="companii_arch_updated_idx")),
    ]
