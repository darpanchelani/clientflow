from django.db.models.signals import post_save
from django.dispatch import receiver

from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task

from .models import WorkflowRule
from .utils import (
    create_lead_follow_up,
    ensure_default_workflow_rules,
    log_global_activity,
    notify_workflow_user,
    workflow_enabled,
)


@receiver(post_save, sender=Lead)
def handle_lead_saved(sender, instance, created, **kwargs):
    ensure_default_workflow_rules(instance.owner)
    if created:
        notify_workflow_user(
            user=instance.owner,
            title='New lead assigned',
            message=f'{instance.name} is assigned to you.',
            target=instance,
            metadata={'lead_id': instance.pk},
            dedupe_key=f'lead-assigned:{instance.pk}:{instance.owner_id}',
        )
        log_global_activity(
            organization_name=instance.organization_name,
            source='lead',
            verb='created',
            message=f'Lead created: {instance.name}',
            actor=instance.owner,
            target=instance,
            metadata={'lead_id': instance.pk},
        )
    if instance.status == Lead.Status.QUALIFIED and workflow_enabled(
        instance.owner,
        WorkflowRule.TriggerType.LEAD_STATUS_CHANGED,
        WorkflowRule.ActionType.CREATE_FOLLOW_UP,
    ):
        create_lead_follow_up(
            lead=instance,
            assigned_user=instance.owner,
            notes='Qualified lead follow-up',
            created_by=instance.owner,
        )


@receiver(post_save, sender=Task)
def handle_task_saved(sender, instance, created, **kwargs):
    owner = instance.assigned_to or instance.project.owner
    if created and instance.assigned_to:
        notify_workflow_user(
            user=instance.assigned_to,
            title='Task assigned',
            message=f'{instance.title} is assigned to you.',
            target=instance,
            metadata={'task_id': instance.pk, 'project_id': instance.project_id},
            dedupe_key=f'task-assigned:{instance.pk}:{instance.assigned_to_id}',
        )
    if instance.status == Task.Status.DONE:
        log_global_activity(
            organization_name=instance.project.client.organization_name,
            source='task',
            verb='completed',
            message=f'Task completed: {instance.title}',
            actor=owner,
            target=instance,
            metadata={'task_id': instance.pk, 'project_id': instance.project_id},
        )


@receiver(post_save, sender=Project)
def handle_project_saved(sender, instance, created, **kwargs):
    if instance.status == Project.Status.COMPLETED:
        notify_workflow_user(
            user=instance.owner,
            title='Project completed',
            message=f'{instance.name} has been marked complete.',
            target=instance,
            metadata={'project_id': instance.pk},
            dedupe_key=f'project-completed:{instance.pk}',
        )
        log_global_activity(
            organization_name=instance.client.organization_name,
            source='project',
            verb='completed',
            message=f'Project completed: {instance.name}',
            actor=instance.owner,
            target=instance,
            metadata={'project_id': instance.pk},
        )


@receiver(post_save, sender=Invoice)
def handle_invoice_saved(sender, instance, created, **kwargs):
    if created:
        log_global_activity(
            organization_name=instance.organization_name,
            source='invoice',
            verb='created',
            message=f'Invoice created: {instance.invoice_number}',
            actor=instance.owner,
            target=instance,
            metadata={'invoice_id': instance.pk},
        )


@receiver(post_save, sender=Payment)
def handle_payment_saved(sender, instance, created, **kwargs):
    if instance.status == Payment.Status.COMPLETED:
        notify_workflow_user(
            user=instance.invoice.owner,
            title='Payment received',
            message=f'Payment received for {instance.invoice.invoice_number}.',
            category='billing',
            target=instance.invoice,
            metadata={'payment_id': instance.pk, 'invoice_id': instance.invoice_id},
            dedupe_key=f'payment-received:{instance.pk}',
        )
        log_global_activity(
            organization_name=instance.invoice.organization_name,
            source='payment',
            verb='received',
            message=f'Payment received for {instance.invoice.invoice_number}',
            actor=instance.created_by,
            target=instance.invoice,
            metadata={'payment_id': instance.pk, 'invoice_id': instance.invoice_id},
        )
