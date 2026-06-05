from django.db.models import Count, Q
from django.utils import timezone

from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task

from .insight_rule_engine import insight_payload


def generate_project_insights(user, scope):
    insights = []
    today = timezone.localdate()
    projects = Project.objects.filter(client__organization_name=scope).select_related('client').annotate(
        task_count=Count('tasks'),
        incomplete_tasks=Count('tasks', filter=~Q(tasks__status=Task.Status.DONE)),
        overdue_tasks=Count('tasks', filter=Q(tasks__due_date__lt=today) & ~Q(tasks__status=Task.Status.DONE)),
    )[:150]

    for project in projects:
        if project.status == Project.Status.ACTIVE and project.end_date:
            days_until_end = (project.end_date - today).days
            if 0 <= days_until_end <= 7 and project.incomplete_tasks > 0:
                insights.append(insight_payload(
                    title='Project delay risk',
                    description=f'{project.name} ends in {days_until_end} days with {project.incomplete_tasks} incomplete tasks.',
                    category='project',
                    severity='warning',
                    recommendation='Review scope, unblock tasks, and adjust delivery plan before the deadline.',
                    source_type='project',
                    source_id=project.pk,
                    score=min(project.incomplete_tasks * 10, 100),
                    metadata={'days_until_end': days_until_end, 'incomplete_tasks': project.incomplete_tasks},
                ))

        if project.status == Project.Status.COMPLETED and project.updated_at >= timezone.now() - timezone.timedelta(days=7):
            insights.append(insight_payload(
                title='Completed project success',
                description=f'{project.name} was recently marked completed.',
                category='project',
                severity='success',
                recommendation='Close out billing, request feedback, and identify expansion opportunities.',
                source_type='project',
                source_id=project.pk,
                score=100,
                metadata={'client_id': project.client_id},
            ))

        if project.status == Project.Status.ACTIVE and project.task_count == 0:
            insights.append(insight_payload(
                title='Project without tasks warning',
                description=f'{project.name} is active but has no tasks.',
                category='project',
                severity='warning',
                recommendation='Create tasks so delivery progress can be tracked.',
                source_type='project',
                source_id=project.pk,
                score=60,
                metadata={'client_id': project.client_id},
            ))

        if project.overdue_tasks >= 3:
            insights.append(insight_payload(
                title='Project workload warning',
                description=f'{project.name} has {project.overdue_tasks} overdue tasks.',
                category='project',
                severity='critical',
                recommendation='Rebalance workload, confirm ownership, and reset delivery expectations.',
                source_type='project',
                source_id=project.pk,
                score=min(project.overdue_tasks * 15, 100),
                metadata={'overdue_tasks': project.overdue_tasks},
            ))

    return insights
