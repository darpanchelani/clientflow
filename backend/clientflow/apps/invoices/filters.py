import django_filters

from .models import Invoice


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')
    client = django_filters.NumberFilter(field_name='client_id')
    project = django_filters.NumberFilter(field_name='project_id')
    issue_date_after = django_filters.DateFilter(field_name='issue_date', lookup_expr='gte')
    issue_date_before = django_filters.DateFilter(field_name='issue_date', lookup_expr='lte')
    due_date_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')

    class Meta:
        model = Invoice
        fields = [
            'status',
            'client',
            'project',
            'issue_date_after',
            'issue_date_before',
            'due_date_after',
            'due_date_before',
        ]

