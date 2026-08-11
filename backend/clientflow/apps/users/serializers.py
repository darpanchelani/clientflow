from rest_framework import serializers

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "email",
            "role",
            "organization_name",
            "created_at",
            "updated_at",
        )

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "organization_name")
        read_only_fields = fields
