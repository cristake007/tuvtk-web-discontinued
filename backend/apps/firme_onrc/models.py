from django.db import models
from django.db.models import Q


class OnrcSnapshot(models.Model):
    class Status(models.TextChoices):
        IMPORTING = "importing", "În curs de import"
        ACTIVE = "active", "Activ"
        ARCHIVED = "archived", "Arhivat"
        FAILED = "failed", "Eșuat"

    snapshot_date = models.DateField(unique=True)
    company_dataset_id = models.UUIDField()
    nomenclature_dataset_id = models.UUIDField()
    source_downloaded_at = models.DateTimeField()
    imported_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.IMPORTING,
    )
    company_count = models.PositiveBigIntegerField(default=0)
    authorized_caen_count = models.PositiveBigIntegerField(default=0)
    company_status_count = models.PositiveBigIntegerField(default=0)
    failure_detail = models.TextField(blank=True)

    class Meta:
        db_table = "onrc_snapshot"
        constraints = [
            models.UniqueConstraint(
                fields=("status",),
                condition=Q(status="active"),
                name="firme_onrc_single_active_snapshot",
            )
        ]
        ordering = ("-snapshot_date",)

    def __str__(self) -> str:
        return self.snapshot_date.isoformat()


class Company(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="companies",
    )
    source_row_number = models.PositiveBigIntegerField()
    name = models.CharField(max_length=200, blank=True)
    cui = models.CharField(max_length=13, blank=True)
    registration_number = models.CharField(max_length=15, blank=True)
    registered_at = models.DateTimeField(null=True, blank=True)
    euid = models.CharField(max_length=22, blank=True)
    legal_form = models.CharField(max_length=4, blank=True)
    country = models.CharField(max_length=8, blank=True)
    county = models.CharField(max_length=18, blank=True)
    locality = models.CharField(max_length=61, blank=True)
    street = models.CharField(max_length=56, blank=True)
    street_number = models.CharField(max_length=20, blank=True)
    building = models.CharField(max_length=40, blank=True)
    staircase = models.CharField(max_length=18, blank=True)
    floor = models.CharField(max_length=15, blank=True)
    apartment = models.CharField(max_length=20, blank=True)
    postal_code = models.CharField(max_length=7, blank=True)
    sector = models.CharField(max_length=1, blank=True)
    address_details = models.CharField(max_length=375, blank=True)
    website = models.CharField(max_length=100, blank=True)
    parent_company_country = models.CharField(max_length=24, blank=True)

    class Meta:
        db_table = "onrc_company"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "source_row_number"),
                name="firme_onrc_company_snapshot_row_unique",
            )
        ]
        indexes = [
            models.Index(fields=("snapshot", "cui"), name="onrc_company_cui_idx"),
            models.Index(
                fields=("snapshot", "registration_number"),
                name="onrc_company_reg_idx",
            ),
            models.Index(fields=("snapshot", "euid"), name="onrc_company_euid_idx"),
            models.Index(fields=("snapshot", "name"), name="onrc_company_name_idx"),
            models.Index(
                fields=("snapshot", "county", "locality"),
                name="onrc_company_location_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.name or self.registration_number or str(self.pk)


class CaenClassification(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="caen_classifications",
    )
    source_row_number = models.PositiveIntegerField()
    section = models.CharField(max_length=1)
    subsection = models.CharField(max_length=2, blank=True)
    division = models.CharField(max_length=2, blank=True)
    group = models.CharField(max_length=3, blank=True)
    class_code = models.CharField(max_length=4)
    name = models.CharField(max_length=203)
    version = models.CharField(max_length=1)

    class Meta:
        db_table = "onrc_caen_classification"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "source_row_number"),
                name="firme_onrc_caen_snapshot_row_unique",
            )
        ]
        indexes = [
            models.Index(
                fields=("snapshot", "class_code", "version"),
                name="onrc_caen_code_version_idx",
            )
        ]


class CompanyStatusNomenclature(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="status_nomenclature",
    )
    code = models.CharField(max_length=4)
    name = models.CharField(max_length=135)

    class Meta:
        db_table = "onrc_company_status_nomenclature"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "code"),
                name="firme_onrc_status_code_unique",
            )
        ]


class CaenVersion(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="caen_versions",
    )
    code = models.CharField(max_length=1)
    description = models.CharField(max_length=14)

    class Meta:
        db_table = "onrc_caen_version"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "code"),
                name="firme_onrc_caen_version_unique",
            )
        ]


class AuthorizedCaen(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="authorized_caen_rows",
    )
    source_row_number = models.PositiveBigIntegerField()
    registration_number = models.CharField(max_length=15, blank=True)
    caen_code = models.CharField(max_length=4)
    caen_version = models.CharField(max_length=1)

    class Meta:
        db_table = "onrc_authorized_caen"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "source_row_number"),
                name="firme_onrc_authorized_caen_snapshot_row_unique",
            )
        ]
        indexes = [
            models.Index(
                fields=("snapshot", "registration_number"),
                name="onrc_authorized_caen_reg_idx",
            ),
            models.Index(
                fields=("snapshot", "caen_code", "caen_version"),
                name="onrc_authorized_caen_code_idx",
            ),
        ]


class CompanyStatus(models.Model):
    snapshot = models.ForeignKey(
        OnrcSnapshot,
        on_delete=models.CASCADE,
        related_name="company_status_rows",
    )
    source_row_number = models.PositiveBigIntegerField()
    registration_number = models.CharField(max_length=15, blank=True)
    status_code = models.CharField(max_length=4)

    class Meta:
        db_table = "onrc_company_status"
        constraints = [
            models.UniqueConstraint(
                fields=("snapshot", "source_row_number"),
                name="firme_onrc_company_status_snapshot_row_unique",
            )
        ]
        indexes = [
            models.Index(
                fields=("snapshot", "registration_number"),
                name="onrc_company_status_reg_idx",
            ),
            models.Index(
                fields=("snapshot", "status_code"),
                name="onrc_company_status_code_idx",
            ),
        ]
