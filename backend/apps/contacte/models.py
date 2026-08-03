from django.conf import settings
from django.db import models


class Contact(models.Model):
    class Status(models.TextChoices):
        ACTIV = "ACTIV", "Activ"
        INACTIV = "INACTIV", "Inactiv"
        FOST_ANGAJAT = "FOST_ANGAJAT", "Fost angajat"

    first_name = models.CharField("prenume", max_length=128)
    last_name = models.CharField("nume", max_length=128)
    job_title = models.CharField("funcție", max_length=255, blank=True)
    company = models.ForeignKey(
        "companii.Companie",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="contacts",
    )
    email = models.EmailField("e-mail", blank=True)
    phone = models.CharField("telefon", max_length=64, blank=True)
    mobile_phone = models.CharField("telefon mobil", max_length=64, blank=True)
    status = models.CharField(
        "statut", max_length=20, choices=Status.choices, default=Status.ACTIV, db_index=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="owned_contacts",
    )
    notes = models.TextField("note interne", blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("last_name", "first_name", "pk")
        indexes = [
            models.Index(fields=("company",), name="contacte_company_idx"),
            models.Index(fields=("owner",), name="contacte_owner_idx"),
            models.Index(fields=("is_archived", "updated_at"), name="contacte_arch_updated_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"
