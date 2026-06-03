import django_filters

from .models import Client


class ClientFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status')

    class Meta:
        model = Client
        fields = ['status']

