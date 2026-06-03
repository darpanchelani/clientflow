from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, blank=True, default='#1976d2')
    organization_name = models.CharField(max_length=255, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='crm_tags',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['organization_name', 'name'],
                name='unique_tag_per_organization',
            )
        ]

    def __str__(self):
        return self.name


class Activity(models.Model):
    class Action(models.TextChoices):
        CREATED = 'created', 'Created'
        UPDATED = 'updated', 'Updated'
        STATUS_CHANGED = 'status_changed', 'Status changed'
        NOTE_ADDED = 'note_added', 'Note added'
        TAGGED = 'tagged', 'Tagged'
        CONVERTED = 'converted', 'Converted'
        DELETED = 'deleted', 'Deleted'

    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    target_object_id = models.PositiveIntegerField()
    target = GenericForeignKey('target_content_type', 'target_object_id')
    action = models.CharField(max_length=50, choices=Action.choices)
    message = models.TextField(blank=True, default='')
    metadata = models.JSONField(blank=True, default=dict)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='crm_activities',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_content_type', 'target_object_id']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        return f'{self.action} - {self.created_at:%Y-%m-%d %H:%M:%S}'


class Note(models.Model):
    target_content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    target_object_id = models.PositiveIntegerField()
    target = GenericForeignKey('target_content_type', 'target_object_id')
    body = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='crm_notes',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_content_type', 'target_object_id']),
        ]

    def __str__(self):
        return self.body[:60]

