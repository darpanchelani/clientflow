from .models import Task, TaskActivity


def log_task_activity(*, task, action, actor=None, message='', metadata=None):
    return TaskActivity.objects.create(
        task=task,
        action=action,
        actor=actor,
        message=message,
        metadata=metadata or {},
    )


def serialize_task_board(queryset):
    grouped = {
        Task.Status.TODO: [],
        Task.Status.IN_PROGRESS: [],
        Task.Status.REVIEW: [],
        Task.Status.DONE: [],
    }
    for task in queryset:
        grouped[task.status].append(task)
    return grouped

