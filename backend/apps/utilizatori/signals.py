from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=get_user_model())
def clear_direct_application_access_for_superuser(sender, instance, **kwargs):
    if instance.is_superuser:
        instance.directly_allowed_applications.clear()
