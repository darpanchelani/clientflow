import django_filters

from clientflow.apps.clients.models import Client

from .models import Project


class ProjectFilter(django_filters.FilterSet):
    client = django_filters.NumberFilter(field_name='client_id')
    status = django_filters.CharFilter(field_name='status')
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_after = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_before = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')

    class Meta:
        model = Project
        fields = ['client', 'status', 'start_date_after', 'start_date_before', 'end_date_after', 'end_date_before']

