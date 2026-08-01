from django.db import models


class SafeCourseDateUpdaterSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    wp_base_url = models.CharField(max_length=2048, blank=True)
    wp_username = models.CharField(max_length=150, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "setări actualizare WordPress"
        verbose_name_plural = "setări actualizare WordPress"

    def __str__(self) -> str:
        return "Actualizare WordPress"
