from django.core.files.images import get_image_dimensions
from rest_framework import serializers

from .models import User


class UserProfileSerializer(serializers.ModelSerializer):
    profile_photo = serializers.ImageField(
        write_only=True, required=False, allow_null=True
    )
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization_name",
            "profile_photo",
            "profile_photo_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "email",
            "role",
            "organization_name",
            "profile_photo_url",
            "created_at",
            "updated_at",
        )

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate_profile_photo(self, value):
        if value is None:
            return value
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile photo must be 5 MB or smaller.")
        if value.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise serializers.ValidationError("Upload a JPEG, PNG, or WebP image.")

        width, height = get_image_dimensions(value)
        value.seek(0)
        if width > 4096 or height > 4096:
            raise serializers.ValidationError(
                "Profile photo must be 4096×4096 pixels or smaller."
            )
        return value

    def get_profile_photo_url(self, obj) -> str | None:
        if not obj.profile_photo:
            return None
        request = self.context.get("request")
        url = obj.profile_photo.url
        return request.build_absolute_uri(url) if request else url

    def update(self, instance, validated_data):
        old_photo_name = instance.profile_photo.name if instance.profile_photo else None
        old_photo_storage = (
            instance.profile_photo.storage if instance.profile_photo else None
        )
        updated_user = super().update(instance, validated_data)

        if (
            old_photo_name
            and old_photo_storage
            and old_photo_name != (updated_user.profile_photo.name or None)
        ):
            old_photo_storage.delete(old_photo_name)
        return updated_user


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "organization_name")
        read_only_fields = fields
