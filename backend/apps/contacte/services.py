from django.db import transaction
from django.utils import timezone

from .models import Contact


@transaction.atomic
def save_contact(*, instance: Contact | None = None, **values) -> Contact:
    contact = instance or Contact()
    for field, value in values.items():
        setattr(contact, field, value)
    contact.save()
    return contact


@transaction.atomic
def archive_contact(contact: Contact) -> Contact:
    if not contact.is_archived:
        contact.is_archived = True
        contact.archived_at = timezone.now()
        contact.save(update_fields=("is_archived", "archived_at", "updated_at"))
    return contact


@transaction.atomic
def restore_contact(contact: Contact) -> Contact:
    if contact.is_archived:
        contact.is_archived = False
        contact.archived_at = None
        contact.save(update_fields=("is_archived", "archived_at", "updated_at"))
    return contact


def recently_updated(limit: int = 5):
    return Contact.objects.select_related("company", "owner").order_by("-updated_at")[:limit]
