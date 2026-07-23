from django.db import models


class ApplicationConfiguration(models.Model):
    site_name = models.CharField(max_length=120, default="TUVTK")
    organization_name = models.CharField(
        max_length=180,
        default="TÜV Thüringen Karpat",
    )
    sidebar_title = models.CharField(max_length=120, default="Workspace")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "application configuration"
        verbose_name_plural = "application configurations"

    def __str__(self) -> str:
        return self.site_name


class NavigationItem(models.Model):
    key = models.SlugField(max_length=80, unique=True)
    label = models.CharField(max_length=120)
    path = models.CharField(max_length=240)
    icon = models.CharField(max_length=80, blank=True)
    position = models.PositiveIntegerField(default=0)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    permission_code = models.CharField(max_length=160, blank=True)
    requires_staff = models.BooleanField(default=False)
    is_enabled = models.BooleanField(default=True)

    class Meta:
        ordering = ("position", "label")

    def __str__(self) -> str:
        return self.label
