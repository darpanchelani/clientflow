from rest_framework import serializers

from .models import Activity, Note, Tag


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'color', 'organization_name', 'created_at', 'updated_at')
        read_only_fields = fields


class ActivitySerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = (
            'id',
            'action',
            'message',
            'metadata',
            'actor_email',
            'created_at',
        )
        read_only_fields = fields

    def get_actor_email(self, obj):
        return getattr(obj.actor, 'email', None)


class NoteSerializer(serializers.ModelSerializer):
    author_email = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = (
            'id',
            'body',
            'author_email',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_author_email(self, obj):
        return getattr(obj.author, 'email', None)


class NoteCreateSerializer(serializers.Serializer):
    body = serializers.CharField()
