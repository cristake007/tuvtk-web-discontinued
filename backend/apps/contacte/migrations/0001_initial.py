import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("companii", "0001_initial"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Contact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=128, verbose_name="prenume")),
                ("last_name", models.CharField(max_length=128, verbose_name="nume")),
                ("job_title", models.CharField(blank=True, max_length=255, verbose_name="funcție")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="e-mail")),
                ("phone", models.CharField(blank=True, max_length=64, verbose_name="telefon")),
                ("mobile_phone", models.CharField(blank=True, max_length=64, verbose_name="telefon mobil")),
                ("status", models.CharField(choices=[("ACTIV", "Activ"), ("INACTIV", "Inactiv"), ("FOST_ANGAJAT", "Fost angajat")], db_index=True, default="ACTIV", max_length=20, verbose_name="statut")),
                ("notes", models.TextField(blank=True, verbose_name="note interne")),
                ("is_archived", models.BooleanField(default=False)),
                ("archived_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("company", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="contacts", to="companii.companie")),
                ("owner", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="owned_contacts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("last_name", "first_name", "pk")},
        ),
        migrations.AddIndex(model_name="contact", index=models.Index(fields=["company"], name="contacte_company_idx")),
        migrations.AddIndex(model_name="contact", index=models.Index(fields=["owner"], name="contacte_owner_idx")),
        migrations.AddIndex(model_name="contact", index=models.Index(fields=["is_archived", "updated_at"], name="contacte_arch_updated_idx")),
    ]
