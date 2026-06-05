from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Notification(models.Model):
    class Category(models.TextChoices):
        BILLING = 'billing', 'Billing'
        CRM = 'crm', 'CRM'
        PROJECT = 'project', 'Project'
        TASK = 'task', 'Task'
        WORKFLOW = 'workflow', 'Workflow'
        SYSTEM = 'system', 'System'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='notifications',
        on_delete=models.CASCADE,
    )
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.BILLING)
    title = models.CharField(max_length=255)
    message = models.TextField()
    target_content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')
    metadata = models.JSONField(blank=True, default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['target_content_type', 'target_object_id']),
        ]

    def __str__(self):
        return self.title
