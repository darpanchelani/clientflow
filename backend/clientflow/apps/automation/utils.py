from datetime import timedelta

from django.utils import timezone

from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.notifications.models import Notification
from clientflow.apps.notifications.utils import create_notification

from .models import AutomationPreference, GlobalActivity, LeadFollowUp, WorkflowRule


DEFAULT_RULES = [
    ('Lead qualified follow-up', WorkflowRule.TriggerType.LEAD_STATUS_CHANGED, WorkflowRule.ActionType.CREATE_FOLLOW_UP),
    ('Invoice overdue alert', WorkflowRule.TriggerType.INVOICE_OVERDUE, WorkflowRule.ActionType.CREATE_NOTIFICATION),
    ('Task due soon alert', WorkflowRule.TriggerType.TASK_DUE_SOON, WorkflowRule.ActionType.CREATE_NOTIFICATION),
    ('Project completed alert', WorkflowRule.TriggerType.PROJECT_COMPLETED, WorkflowRule.ActionType.CREATE_NOTIFICATION),
    ('Payment received alert', WorkflowRule.TriggerType.PAYMENT_RECEIVED, WorkflowRule.ActionType.CREATE_NOTIFICATION),
]


def get_preferences(user):
    preferences, _ = AutomationPreference.objects.get_or_create(user=user)
    return preferences


def ensure_default_workflow_rules(user):
    organization_name = get_scope_key(user)
    for name, trigger_type, action_type in DEFAULT_RULES:
        WorkflowRule.objects.get_or_create(
            organization_name=organization_name,
            trigger_type=trigger_type,
            action_type=action_type,
            name=name,
            defaults={'created_by': user, 'is_active': True},
        )


def workflow_enabled(user, trigger_type, action_type=None):
    organization_name = get_scope_key(user)
    queryset = WorkflowRule.objects.filter(
        organization_name=organization_name,
        trigger_type=trigger_type,
        is_active=True,
    )
    if action_type:
        queryset = queryset.filter(action_type=action_type)
    return queryset.exists()


def notify_workflow_user(*, user, title, message, category=Notification.Category.WORKFLOW, target=None, metadata=None, dedupe_key=None):
    preferences = get_preferences(user)
    if not preferences.in_app_notifications_enabled:
        return None
    payload = metadata or {}
    if preferences.email_notifications_enabled:
        payload = {**payload, 'email_ready': True}
    return create_notification(
        user=user,
        title=title,
        message=message,
        category=category,
        target=target,
        metadata=payload,
        dedupe_key=dedupe_key,
    )


def log_global_activity(*, organization_name, source, verb, message, actor=None, target=None, metadata=None):
    return GlobalActivity.objects.create(
        organization_name=organization_name,
        source=source,
        verb=verb,
        message=message,
        actor=actor,
        target=target,
        metadata=metadata or {},
    )


def create_lead_follow_up(*, lead, assigned_user=None, days=None, due_date=None, notes='', created_by=None):
    user = assigned_user or lead.owner
    preferences = get_preferences(user)
    due_on = due_date or timezone.localdate() + timedelta(days=days or preferences.lead_follow_up_days)
    follow_up, created = LeadFollowUp.objects.get_or_create(
        lead=lead,
        assigned_user=user,
        status=LeadFollowUp.Status.PENDING,
        defaults={
            'due_date': due_on,
            'notes': notes,
            'created_by': created_by,
        },
    )
    if created:
        notify_workflow_user(
            user=user,
            title='Lead follow-up scheduled',
            message=f'Follow up with {lead.name} by {due_on}.',
            category=Notification.Category.CRM,
            target=lead,
            metadata={'lead_id': lead.pk, 'follow_up_id': follow_up.pk},
            dedupe_key=f'lead-follow-up-created:{lead.pk}:{follow_up.pk}',
        )
        log_global_activity(
            organization_name=lead.organization_name,
            source='lead',
            verb='follow_up_created',
            message=f'Follow-up scheduled for {lead.name}',
            actor=created_by,
            target=lead,
            metadata={'follow_up_id': follow_up.pk},
        )
    return follow_up
