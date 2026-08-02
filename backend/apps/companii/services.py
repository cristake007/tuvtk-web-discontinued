import re

from django.db import transaction
from django.utils import timezone

from .models import Companie


def normalize_cui(value: str | None) -> str | None:
    if not value or not value.strip():
        return None
    normalized = re.sub(r"\s+", "", value).upper()
    digits = normalized[2:] if normalized.startswith("RO") else normalized
    if not digits.isdigit():
        raise ValueError("CUI-ul trebuie să conțină doar cifre, cu prefixul opțional RO.")
    return digits


@transaction.atomic
def save_company(*, instance: Companie | None = None, **values) -> Companie:
    company = instance or Companie()
    if "cui" in values:
        values["cui"] = normalize_cui(values["cui"])
    for field, value in values.items():
        setattr(company, field, value)
    company.save()
    return company


@transaction.atomic
def archive_company(company: Companie) -> Companie:
    if not company.is_archived:
        company.is_archived = True
        company.archived_at = timezone.now()
        company.save(update_fields=("is_archived", "archived_at", "updated_at"))
    return company


@transaction.atomic
def restore_company(company: Companie) -> Companie:
    if company.is_archived:
        company.is_archived = False
        company.archived_at = None
        company.save(update_fields=("is_archived", "archived_at", "updated_at"))
    return company
