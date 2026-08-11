from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import get_scope_key, log_activity

from .filters import ProjectFilter
from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ProjectFilter
    search_fields = ['name', 'description', 'client__name', 'client__company']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'name', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Project.objects.none()
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Project.objects.select_related('client', 'owner', 'client__lead').prefetch_related('tasks')
        if scope:
            queryset = queryset.filter(Q(owner=user) | Q(client__organization_name=scope))
        else:
            queryset = queryset.filter(owner=user)
        return queryset

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        log_activity(
            target=project,
            action=Activity.Action.CREATED,
            actor=self.request.user,
            message='Project created',
            metadata={'project_id': project.pk},
        )

    def perform_update(self, serializer):
        project = serializer.save()
        log_activity(
            target=project,
            action=Activity.Action.UPDATED,
            actor=self.request.user,
            message='Project updated',
            metadata={'project_id': project.pk},
        )

    def perform_destroy(self, instance):
        log_activity(
            target=instance,
            action=Activity.Action.DELETED,
            actor=self.request.user,
            message='Project deleted',
            metadata={'project_id': instance.pk},
        )
        instance.delete()
