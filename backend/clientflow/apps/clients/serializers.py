from rest_framework import serializers

from clientflow.apps.crm.models import Tag
from clientflow.apps.crm.serializers import TagSerializer
from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.leads.models import Lead

from .models import Client


class LeadSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ('id', 'name', 'email', 'phone', 'company', 'status', 'source')
        read_only_fields = fields


class ClientSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )
    lead = LeadSummarySerializer(read_only=True)
    lead_id = serializers.PrimaryKeyRelatedField(
        source='lead',
        queryset=Lead.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            'id',
            'lead',
            'lead_id',
            'name',
            'email',
            'phone',
            'company',
            'status',
            'tags',
            'tag_names',
            'owner_email',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'lead', 'tags', 'owner_email', 'created_at', 'updated_at')

    def get_owner_email(self, obj):
        return getattr(obj.owner, 'email', None)

    def _sync_tags(self, client, tag_names):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if tag_names is None or not user:
            return

        scope = get_scope_key(user)
        tags = []
        for raw_name in tag_names:
            name = raw_name.strip()
            if not name:
                continue
            tag, _ = Tag.objects.get_or_create(
                organization_name=scope,
                name=name,
                defaults={'created_by': user},
            )
            tags.append(tag)
        client.tags.set(tags)

    def validate_lead(self, lead):
        if lead is None:
            return lead

        request = self.context.get('request')
        user = getattr(request, 'user', None)
        scope = get_scope_key(user)
        if lead.organization_name != scope:
            raise serializers.ValidationError('Selected lead does not belong to your organization.')
        if hasattr(lead, 'client'):
            raise serializers.ValidationError('Selected lead has already been converted into a client.')
        return lead

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        client = Client.objects.create(**validated_data)
        self._sync_tags(client, tag_names)
        return client

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        client = super().update(instance, validated_data)
        if tag_names is not None:
            self._sync_tags(client, tag_names)
        return client


class ClientStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Client.Status.choices)
