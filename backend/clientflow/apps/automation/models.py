from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


class WorkflowRule(models.Model):
    class TriggerType(models.TextChoices):
        LEAD_STATUS_CHANGED = 'lead_status_changed', 'Lead status changed'
        LEAD_INACTIVE = 'lead_inactive', 'Lead inactive'
        INVOICE_OVERDUE = 'invoice_overdue', 'Invoice overdue'
        INVOICE_DUE_SOON = 'invoice_due_soon', 'Invoice due soon'
        PAYMENT_RECEIVED = 'payment_received', 'Payment received'
        TASK_DUE_SOON = 'task_due_soon', 'Task due soon'
        TASK_OVERDUE = 'task_overdue', 'Task overdue'
        PROJECT_COMPLETED = 'project_completed', 'Project completed'
        PROJECT_OVERDUE = 'project_overdue', 'Project overdue'

    class ActionType(models.TextChoices):
        CREATE_NOTIFICATION = 'create_notification', 'Create notification'
        CREATE_FOLLOW_UP = 'create_follow_up', 'Create follow-up'
        EMAIL_READY = 'email_ready', 'Email ready'

    name = models.CharField(max_length=255)
    trigger_type = models.CharField(max_length=50, choices=TriggerType.choices)
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    is_active = models.BooleanField(default=True)
    conditions = models.JSONField(blank=True, default=dict)
    action_config = models.JSONField(blank=True, default=dict)
    organization_name = models.CharField(max_length=255, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='workflow_rules',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['trigger_type', 'name']
        indexes = [
            models.Index(fields=['organization_name', 'trigger_type', 'is_active']),
        ]

    def __str__(self):
        return self.name


class AutomationPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='automation_preferences',
        on_delete=models.CASCADE,
    )
    in_app_notifications_enabled = models.BooleanField(default=True)
    email_notifications_enabled = models.BooleanField(default=False)
    lead_follow_up_days = models.PositiveSmallIntegerField(default=7)
    task_due_soon_hours = models.PositiveSmallIntegerField(default=24)
    invoice_before_due_days = models.PositiveSmallIntegerField(default=3)
    invoice_after_overdue_days = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Automation preferences for {self.user_id}'


class LeadFollowUp(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    lead = models.ForeignKey('leads.Lead', related_name='follow_ups', on_delete=models.CASCADE)
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='lead_follow_ups',
        on_delete=models.CASCADE,
    )
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name='created_follow_ups',
        on_delete=models.SET_NULL,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['status', 'due_date']
        indexes = [
            models.Index(fields=['assigned_user', 'status', 'due_date']),
            models.Index(fields=['lead', 'status']),
        ]

    def complete(self):
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])

    def __str__(self):
        return f'{self.lead_id} follow-up due {self.due_date}'


class GlobalActivity(models.Model):
    target_content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    target_object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name='global_activities',
        on_delete=models.SET_NULL,
    )
    organization_name = models.CharField(max_length=255, db_index=True)
    verb = models.CharField(max_length=80)
    message = models.TextField()
    source = models.CharField(max_length=50, db_index=True)
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization_name', 'created_at']),
            models.Index(fields=['source', 'created_at']),
            models.Index(fields=['target_content_type', 'target_object_id']),
        ]

    def __str__(self):
        return self.message[:80]
