from django.db import transaction
from django.db.models import F
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clientflow.apps.crm.utils import get_scope_key
from .models import Task, TaskActivity

from .serializers import TaskAssignSerializer, TaskSerializer, TaskStatusSerializer, TaskActivitySerializer
from .utils import log_task_activity, serialize_task_board


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'assigned_to', 'status', 'priority']
    search_fields = ['title', 'description', 'project__name', 'assigned_to__email']
    ordering_fields = ['created_at', 'updated_at', 'due_date', 'priority', 'status', 'title']
    ordering = ['status', '-updated_at']

    def get_queryset(self):
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Task.objects.select_related('project', 'project__client', 'assigned_to', 'project__owner').all()
        if scope:
            queryset = queryset.filter(
                project__client__organization_name=scope
            )
        else:
            queryset = queryset.filter(project__owner=user)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        task = serializer.save()
        log_task_activity(
            task=task,
            action=TaskActivity.Action.CREATED,
            actor=self.request.user,
            message='Task created',
            metadata={'task_id': task.pk},
        )

    @transaction.atomic
    def perform_update(self, serializer):
        task = self.get_object()
        previous_status = task.status
        previous_assignee = task.assigned_to_id
        task = serializer.save()
        log_task_activity(
            task=task,
            action=TaskActivity.Action.UPDATED,
            actor=self.request.user,
            message='Task updated',
            metadata={'task_id': task.pk},
        )
        if previous_status != task.status:
            log_task_activity(
                task=task,
                action=TaskActivity.Action.STATUS_CHANGED,
                actor=self.request.user,
                message='Task status changed',
                metadata={'previous_status': previous_status, 'current_status': task.status},
            )
        if previous_assignee != task.assigned_to_id:
            log_task_activity(
                task=task,
                action=TaskActivity.Action.ASSIGNED,
                actor=self.request.user,
                message='Task reassigned',
                metadata={'previous_assignee_id': previous_assignee, 'current_assignee_id': task.assigned_to_id},
            )

    @transaction.atomic
    def perform_destroy(self, instance):
        log_task_activity(
            task=instance,
            action=TaskActivity.Action.DELETED,
            actor=self.request.user,
            message='Task deleted',
            metadata={'task_id': instance.pk},
        )
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        task = self.get_object()
        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        previous_status = task.status
        task.status = serializer.validated_data['status']
        task.save(update_fields=['status', 'updated_at'])
        log_task_activity(
            task=task,
            action=TaskActivity.Action.STATUS_CHANGED,
            actor=request.user,
            message='Task status changed',
            metadata={'previous_status': previous_status, 'current_status': task.status},
        )
        return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='assign')
    def assign(self, request, pk=None):
        task = self.get_object()
        serializer = TaskAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        previous_assignee = task.assigned_to_id
        assignee = serializer.validated_data.get('assigned_to_id')
        if assignee is not None and assignee.organization_name != task.project.client.organization_name:
            return Response(
                {'assigned_to_id': ['Assigned user must belong to the same organization as the project.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task.assigned_to = assignee
        task.save(update_fields=['assigned_to', 'updated_at'])
        log_task_activity(
            task=task,
            action=TaskActivity.Action.ASSIGNED,
            actor=request.user,
            message='Task assigned',
            metadata={'previous_assignee_id': previous_assignee, 'current_assignee_id': task.assigned_to_id},
        )
        return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def board(self, request):
        queryset = self.filter_queryset(self.get_queryset()).select_related('project', 'assigned_to')
        project_id = request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        assignee_id = request.query_params.get('assigned_to')
        if assignee_id:
            queryset = queryset.filter(assigned_to_id=assignee_id)
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        grouped = serialize_task_board(queryset)
        return Response(
            {
                'todo': TaskSerializer(grouped[Task.Status.TODO], many=True, context={'request': request}).data,
                'in_progress': TaskSerializer(grouped[Task.Status.IN_PROGRESS], many=True, context={'request': request}).data,
                'review': TaskSerializer(grouped[Task.Status.REVIEW], many=True, context={'request': request}).data,
                'done': TaskSerializer(grouped[Task.Status.DONE], many=True, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        task = self.get_object()
        logs = task.activity_logs.select_related('actor').all()
        return Response(TaskActivitySerializer(logs, many=True).data, status=status.HTTP_200_OK)
