from django.conf import settings
from django.db import models
from django.db.models import Q


class Companie(models.Model):
    class Status(models.TextChoices):
        ACTIV = "ACTIV", "Activ"
        PROSPECT = "PROSPECT", "Prospect"
        INACTIV = "INACTIV", "Inactiv"

    class VatStatus(models.TextChoices):
        TVA_PLATITOR = "TVA_PLATITOR", "Plătitor de TVA"
        TVA_NEPLATITOR = "TVA_NEPLATITOR", "Neplătitor de TVA"

    name = models.CharField("nume", max_length=255, db_index=True)
    legal_name = models.CharField("denumire juridică", max_length=255, blank=True)
    cui = models.CharField("CUI", max_length=32, blank=True)
    trade_registry_number = models.CharField(
        "număr registrul comerțului", max_length=64, blank=True
    )
    vat_status = models.CharField("statut TVA", max_length=20, choices=VatStatus.choices)
    status = models.CharField(
        "statut", max_length=20, choices=Status.choices, default=Status.PROSPECT, db_index=True
    )
    website = models.URLField("website", blank=True)
    email = models.EmailField("e-mail general", blank=True)
    phone = models.CharField("telefon", max_length=64, blank=True)
    street = models.CharField("stradă", max_length=255, blank=True)
    city = models.CharField("localitate", max_length=128, blank=True)
    county = models.CharField("județ", max_length=128, blank=True)
    postal_code = models.CharField("cod poștal", max_length=20, blank=True)
    country = models.CharField("țară", max_length=128, default="România")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="owned_companies",
    )
    notes = models.TextField("note interne", blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "pk")
        constraints = [
            models.UniqueConstraint(
                fields=("cui",),
                condition=~Q(cui=""),
                name="companii_unique_present_cui",
            )
        ]
        indexes = [
            models.Index(fields=("owner",), name="companii_owner_idx"),
            models.Index(fields=("is_archived", "updated_at"), name="companii_arch_updated_idx"),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        from .services import normalize_cui

        self.cui = normalize_cui(self.cui)
        return super().save(*args, **kwargs)
