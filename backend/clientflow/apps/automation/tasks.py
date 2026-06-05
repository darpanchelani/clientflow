from datetime import timedelta

from celery import shared_task
from django.db.models import Sum
from django.utils import timezone

from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task

from .models import AutomationPreference, LeadFollowUp
from .utils import create_lead_follow_up, log_global_activity, notify_workflow_user


@shared_task
def check_inactive_leads():
    today = timezone.localdate()
    for preference in AutomationPreference.objects.select_related('user'):
        inactive_before = timezone.now() - timedelta(days=preference.lead_follow_up_days)
        leads = Lead.objects.filter(
            owner=preference.user,
            status__in=[Lead.Status.NEW, Lead.Status.CONTACTED, Lead.Status.QUALIFIED, Lead.Status.PROPOSAL],
            updated_at__lte=inactive_before,
        )
        for lead in leads:
            create_lead_follow_up(
                lead=lead,
                assigned_user=preference.user,
                due_date=today,
                notes='Lead inactive follow-up',
                created_by=preference.user,
            )


@shared_task
def check_follow_up_reminders():
    today = timezone.localdate()
    follow_ups = LeadFollowUp.objects.select_related('lead', 'assigned_user').filter(
        status=LeadFollowUp.Status.PENDING,
        due_date__lte=today,
    )
    for follow_up in follow_ups:
        state = 'overdue' if follow_up.due_date < today else 'due today'
        notify_workflow_user(
            user=follow_up.assigned_user,
            title='Follow-up reminder',
            message=f'{follow_up.lead.name} follow-up is {state}.',
            target=follow_up.lead,
            metadata={'lead_id': follow_up.lead_id, 'follow_up_id': follow_up.pk},
            dedupe_key=f'follow-up-reminder:{follow_up.pk}:{today}',
        )


@shared_task
def check_task_deadlines():
    now = timezone.now()
    today = timezone.localdate()
    for preference in AutomationPreference.objects.select_related('user'):
        due_limit = (timezone.now() + timedelta(hours=preference.task_due_soon_hours)).date()
        tasks_due_soon = Task.objects.select_related('project', 'project__client', 'assigned_to').filter(
            assigned_to=preference.user,
            due_date__isnull=False,
            due_date__gte=today,
            due_date__lte=due_limit,
        ).exclude(status=Task.Status.DONE)
        for task in tasks_due_soon:
            notify_workflow_user(
                user=preference.user,
                title='Task due soon',
                message=f'{task.title} is due on {task.due_date}.',
                category='task',
                target=task,
                metadata={'task_id': task.pk, 'project_id': task.project_id},
                dedupe_key=f'task-due-soon:{task.pk}:{today}',
            )

        overdue_tasks = Task.objects.select_related('project', 'project__client', 'assigned_to').filter(
            assigned_to=preference.user,
            due_date__lt=today,
        ).exclude(status=Task.Status.DONE)
        for task in overdue_tasks:
            notify_workflow_user(
                user=preference.user,
                title='Task overdue',
                message=f'{task.title} was due on {task.due_date}.',
                category='task',
                target=task,
                metadata={'task_id': task.pk, 'project_id': task.project_id},
                dedupe_key=f'task-overdue:{task.pk}:{today}',
            )
    return {'checked_at': now.isoformat()}


@shared_task
def check_invoice_reminders():
    today = timezone.localdate()
    active_invoices = Invoice.objects.select_related('owner', 'client').filter(
        status__in=[Invoice.Status.SENT, Invoice.Status.OVERDUE],
    )
    for invoice in active_invoices:
        preference = AutomationPreference.objects.get_or_create(user=invoice.owner)[0]
        due_soon_date = today + timedelta(days=preference.invoice_before_due_days)
        if invoice.status == Invoice.Status.SENT and today <= invoice.due_date <= due_soon_date:
            notify_workflow_user(
                user=invoice.owner,
                title='Invoice due soon',
                message=f'{invoice.invoice_number} is due on {invoice.due_date}.',
                category='billing',
                target=invoice,
                metadata={'invoice_id': invoice.pk},
                dedupe_key=f'invoice-due-soon:{invoice.pk}:{today}',
            )
        if invoice.due_date < today and invoice.status != Invoice.Status.OVERDUE:
            invoice.status = Invoice.Status.OVERDUE
            invoice.save(update_fields=['status', 'updated_at'])
            notify_workflow_user(
                user=invoice.owner,
                title='Invoice overdue',
                message=f'{invoice.invoice_number} is overdue.',
                category='billing',
                target=invoice,
                metadata={'invoice_id': invoice.pk},
                dedupe_key=f'invoice-overdue:{invoice.pk}',
            )
            log_global_activity(
                organization_name=invoice.organization_name,
                source='invoice',
                verb='overdue',
                message=f'Invoice overdue: {invoice.invoice_number}',
                actor=invoice.owner,
                target=invoice,
                metadata={'invoice_id': invoice.pk},
            )


@shared_task
def check_project_deadlines():
    today = timezone.localdate()
    projects = Project.objects.select_related('owner', 'client').filter(
        end_date__lt=today,
        status__in=[Project.Status.ACTIVE, Project.Status.PAUSED],
    )
    for project in projects:
        notify_workflow_user(
            user=project.owner,
            title='Project overdue',
            message=f'{project.name} passed its end date on {project.end_date}.',
            category='project',
            target=project,
            metadata={'project_id': project.pk},
            dedupe_key=f'project-overdue:{project.pk}:{today}',
        )


@shared_task
def run_workflow_automation():
    check_inactive_leads.delay()
    check_follow_up_reminders.delay()
    check_task_deadlines.delay()
    check_invoice_reminders.delay()
    check_project_deadlines.delay()


def build_dashboard_summary(user):
    today = timezone.localdate()
    overdue_invoices = Invoice.objects.filter(
        owner=user,
        status=Invoice.Status.OVERDUE,
    ).count()
    upcoming_tasks = Task.objects.filter(
        assigned_to=user,
        due_date__gte=today,
        due_date__lte=today + timedelta(days=1),
    ).exclude(status=Task.Status.DONE).count()
    pending_follow_ups = LeadFollowUp.objects.filter(
        assigned_user=user,
        status=LeadFollowUp.Status.PENDING,
    ).count()
    active_projects = Project.objects.filter(owner=user, status=Project.Status.ACTIVE).count()
    revenue_total = Invoice.objects.filter(owner=user, status=Invoice.Status.PAID).aggregate(
        total=Sum('total')
    ).get('total') or 0
    overdue_follow_ups = LeadFollowUp.objects.filter(
        assigned_user=user,
        status=LeadFollowUp.Status.PENDING,
        due_date__lt=today,
    ).count()
    return {
        'overdue_invoices': overdue_invoices,
        'upcoming_tasks': upcoming_tasks,
        'pending_follow_ups': pending_follow_ups,
        'overdue_follow_ups': overdue_follow_ups,
        'active_projects': active_projects,
        'revenue_summary': str(revenue_total),
    }
