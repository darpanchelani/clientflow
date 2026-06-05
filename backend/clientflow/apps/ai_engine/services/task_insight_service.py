from django.db.models import Count
from django.utils import timezone

from clientflow.apps.tasks.models import Task

from .insight_rule_engine import insight_payload


def generate_task_insights(user, scope):
    insights = []
    today = timezone.localdate()
    tomorrow = today + timezone.timedelta(days=1)
    tasks = Task.objects.filter(project__client__organization_name=scope).select_related('project', 'assigned_to')[:300]

    for task in tasks:
        if task.status == Task.Status.DONE or not task.due_date:
            continue

        if task.due_date < today:
            insights.append(insight_payload(
                title='Overdue task critical',
                description=f'{task.title} was due on {task.due_date} and is still {task.status}.',
                category='task',
                severity='critical',
                recommendation='Update the task owner, resolve blockers, or adjust the project plan.',
                source_type='task',
                source_id=task.pk,
                score=90,
                metadata={'project_id': task.project_id, 'assigned_to_id': task.assigned_to_id},
            ))
        elif task.due_date <= tomorrow:
            insights.append(insight_payload(
                title='Upcoming task reminder',
                description=f'{task.title} is due by {task.due_date}.',
                category='task',
                severity='info',
                recommendation='Confirm owner availability and move the task forward before it becomes overdue.',
                source_type='task',
                source_id=task.pk,
                score=50,
                metadata={'project_id': task.project_id, 'assigned_to_id': task.assigned_to_id},
            ))

        age_days = (timezone.now() - task.created_at).days
        if task.priority in [Task.Priority.HIGH, Task.Priority.URGENT] and task.status in [Task.Status.TODO, Task.Status.IN_PROGRESS] and age_days >= 7:
            insights.append(insight_payload(
                title='High priority blocked work',
                description=f'{task.title} is {task.priority} priority and has been open for {age_days} days.',
                category='task',
                severity='warning',
                recommendation='Review blockers and reassign or escalate this task if needed.',
                source_type='task',
                source_id=task.pk,
                score=min(age_days * 5, 100),
                metadata={'priority': task.priority, 'age_days': age_days},
            ))

    completed_recently = Task.objects.filter(
        project__client__organization_name=scope,
        status=Task.Status.DONE,
        updated_at__gte=timezone.now() - timezone.timedelta(days=7),
    ).values('assigned_to').annotate(count=Count('id'))
    for row in completed_recently:
        if row['count'] >= 5:
            insights.append(insight_payload(
                title='Productivity success',
                description=f'{row["count"]} tasks were completed by one team member in the last 7 days.',
                category='task',
                severity='success',
                recommendation='Recognize the momentum and check whether this completion pattern can be repeated.',
                source_type='user',
                source_id=row['assigned_to'],
                score=row['count'],
                metadata={'completed_tasks': row['count']},
            ))

    return insights
