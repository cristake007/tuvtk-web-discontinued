from django.apps import AppConfig


class UtilizatoriConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.utilizatori"

    def ready(self):
        from . import signals  # noqa: F401
    verbose_name = "Utilizatori"
