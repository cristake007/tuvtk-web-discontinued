import django_filters
from django.contrib.auth import get_user_model
from django.db.models import Q, QuerySet


class UtilizatorFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.ChoiceFilter(
        choices=(
            ("all", "Toate stările"),
            ("active", "Activ"),
            ("inactive", "Inactiv"),
        ),
        method="filter_status",
    )
    role = django_filters.ChoiceFilter(
        choices=(
            ("all", "Toate rolurile"),
            ("staff", "Administrator"),
            ("user", "Utilizator"),
        ),
        method="filter_role",
    )
    group = django_filters.NumberFilter(field_name="groups__id")

    class Meta:
        model = get_user_model()
        fields: tuple[str, ...] = ()

    def filter_search(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        search = value.strip()
        if not search:
            return queryset
        return queryset.filter(
            Q(username__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
        )

    def filter_status(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        if value == "active":
            return queryset.filter(is_active=True)
        if value == "inactive":
            return queryset.filter(is_active=False)
        return queryset

    def filter_role(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        if value == "staff":
            return queryset.filter(is_staff=True)
        if value == "user":
            return queryset.filter(is_staff=False)
        return queryset
