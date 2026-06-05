from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    target_type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            'id',
            'category',
            'title',
            'message',
            'target_type',
            'target_object_id',
            'metadata',
            'is_read',
            'created_at',
        )
        read_only_fields = fields

    def get_target_type(self, obj):
        if not obj.target_content_type_id:
            return None
        return obj.target_content_type.model
