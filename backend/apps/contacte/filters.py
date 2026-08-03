import django_filters
from django.db.models import Q, QuerySet

from .models import Contact


class ContactFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    company = django_filters.NumberFilter(field_name="company_id")
    status = django_filters.ChoiceFilter(choices=Contact.Status.choices)
    owner = django_filters.NumberFilter(field_name="owner_id")
    archived = django_filters.BooleanFilter(field_name="is_archived")

    class Meta:
        model = Contact
        fields = ("company", "status", "owner", "archived")

    def filter_search(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        search = value.strip()
        if not search:
            return queryset
        return queryset.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(email__icontains=search)
            | Q(company__name__icontains=search)
        )
