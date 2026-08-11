from rest_framework import serializers

from clientflow.apps.crm.models import Tag
from clientflow.apps.crm.serializers import TagSerializer
from clientflow.apps.crm.utils import get_scope_key

from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = (
            'id',
            'name',
            'email',
            'phone',
            'company',
            'source',
            'status',
            'score',
            'tags',
            'tag_names',
            'owner_email',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tags', 'owner_email', 'created_at', 'updated_at')

    def get_owner_email(self, obj) -> str | None:
        return getattr(obj.owner, 'email', None)

    def _sync_tags(self, lead, tag_names):
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
        lead.tags.set(tags)

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        lead = Lead.objects.create(**validated_data)
        self._sync_tags(lead, tag_names)
        return lead

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        lead = super().update(instance, validated_data)
        if tag_names is not None:
            self._sync_tags(lead, tag_names)
        return lead


class LeadStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Lead.Status.choices)
