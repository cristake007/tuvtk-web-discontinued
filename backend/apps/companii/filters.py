import django_filters
from django.db.models import Q, QuerySet

from .models import Companie


class CompanieFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.ChoiceFilter(choices=Companie.Status.choices)
    vat_status = django_filters.ChoiceFilter(choices=Companie.VatStatus.choices)
    owner = django_filters.NumberFilter(field_name="owner_id")
    archived = django_filters.BooleanFilter(field_name="is_archived")

    class Meta:
        model = Companie
        fields = ("status", "vat_status", "owner", "archived")

    def filter_search(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        search = value.strip()
        if not search:
            return queryset
        return queryset.filter(
            Q(name__icontains=search)
            | Q(legal_name__icontains=search)
            | Q(cui__icontains=search)
            | Q(email__icontains=search)
        )
