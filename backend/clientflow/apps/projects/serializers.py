from rest_framework import serializers

from clientflow.apps.clients.models import Client
from clientflow.apps.users.models import User

from .models import Project


class ClientSummarySerializer(serializers.ModelSerializer):
    lead_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Client
        fields = ('id', 'name', 'email', 'phone', 'company', 'status', 'lead_id')
        read_only_fields = fields


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    client = ClientSummarySerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        source='client',
        queryset=Client.objects.all(),
        write_only=True,
    )
    owner = UserSummarySerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source='owner',
        queryset=User.objects.all(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Project
        fields = (
            'id',
            'name',
            'description',
            'client',
            'client_id',
            'owner',
            'owner_id',
            'status',
            'start_date',
            'end_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'client', 'owner', 'created_at', 'updated_at')

    def validate(self, attrs):
        client = attrs.get('client')
        owner = attrs.get('owner')
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if owner is None and user is not None:
            attrs['owner'] = user
            owner = user
        if client is not None and owner is not None:
            if client.organization_name != getattr(owner, 'organization_name', ''):
                raise serializers.ValidationError('Project client must belong to the same organization as the owner.')
        return attrs
