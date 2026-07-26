from django.conf import settings
from django.contrib.auth.models import Group
from django.db import models


class ApplicationDefinition(models.Model):
    key = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    route_prefix = models.CharField(max_length=240, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_enabled = models.BooleanField(default=True)
    allowed_groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name="allowed_applications",
    )
    allowed_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="directly_allowed_applications",
    )
    is_access_controlled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("position", "name")
        verbose_name = "application definition"
        verbose_name_plural = "application definitions"

    def __str__(self) -> str:
        return self.name


class ApplicationConfiguration(models.Model):
    site_name = models.CharField(max_length=120, default="TUVTK")
    organization_name = models.CharField(
        max_length=180,
        default="TÜV Thüringen Karpat",
    )
    sidebar_title = models.CharField(max_length=120, default="Workspace")
    company_logo_svg = models.TextField(blank=True, default="")
    culoare_primara = models.CharField(max_length=7, default="#164194")
    culoare_accent = models.CharField(max_length=7, default="#d41131")
    culoare_fundal = models.CharField(max_length=7, default="#ffffff")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "application configuration"
        verbose_name_plural = "application configurations"

    def __str__(self) -> str:
        return self.site_name


class NavigationItem(models.Model):
    application = models.ForeignKey(
        ApplicationDefinition,
        on_delete=models.PROTECT,
        related_name="navigation_items",
    )
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
    is_separator = models.BooleanField(default=False)

    class Meta:
        ordering = ("position", "label")

    def __str__(self) -> str:
        return self.label
