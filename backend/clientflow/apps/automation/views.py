from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from clientflow.apps.crm.utils import get_scope_key
from .models import AutomationPreference, GlobalActivity, LeadFollowUp, WorkflowRule
from .serializers import (
    AutomationDashboardSummarySerializer,
    AutomationPreferenceSerializer,
    GlobalActivitySerializer,
    LeadFollowUpCreateSerializer,
    LeadFollowUpSerializer,
    WorkflowRuleSerializer,
)
from .tasks import build_dashboard_summary
from .utils import ensure_default_workflow_rules, log_global_activity


class WorkflowRuleViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowRuleSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['trigger_type', 'action_type', 'is_active']
    search_fields = ['name']
    ordering = ['trigger_type', 'name']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return WorkflowRule.objects.none()
        ensure_default_workflow_rules(self.request.user)
        return WorkflowRule.objects.filter(organization_name=get_scope_key(self.request.user))

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, organization_name=get_scope_key(self.request.user))


class AutomationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AutomationPreferenceSerializer)
    def get(self, request):
        preferences, _ = AutomationPreference.objects.get_or_create(user=request.user)
        return Response(AutomationPreferenceSerializer(preferences).data, status=status.HTTP_200_OK)

    @extend_schema(request=AutomationPreferenceSerializer, responses=AutomationPreferenceSerializer)
    def put(self, request):
        preferences, _ = AutomationPreference.objects.get_or_create(user=request.user)
        serializer = AutomationPreferenceSerializer(preferences, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=AutomationPreferenceSerializer, responses=AutomationPreferenceSerializer)
    def patch(self, request):
        preferences, _ = AutomationPreference.objects.get_or_create(user=request.user)
        serializer = AutomationPreferenceSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class LeadFollowUpViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'assigned_user', 'lead']
    search_fields = ['lead__name', 'lead__company', 'notes']
    ordering_fields = ['due_date', 'created_at', 'updated_at', 'status']
    ordering = ['status', 'due_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadFollowUpCreateSerializer
        return LeadFollowUpSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return LeadFollowUp.objects.none()
        scope = get_scope_key(self.request.user)
        return LeadFollowUp.objects.select_related('lead', 'assigned_user', 'created_by', 'lead__owner').filter(
            Q(assigned_user=self.request.user) | Q(lead__organization_name=scope)
        )

    def perform_create(self, serializer):
        follow_up = serializer.save(created_by=self.request.user)
        log_global_activity(
            organization_name=follow_up.lead.organization_name,
            source='lead',
            verb='follow_up_created',
            message=f'Follow-up scheduled for {follow_up.lead.name}',
            actor=self.request.user,
            target=follow_up.lead,
            metadata={'follow_up_id': follow_up.pk},
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.complete()
        log_global_activity(
            organization_name=follow_up.lead.organization_name,
            source='lead',
            verb='follow_up_completed',
            message=f'Follow-up completed for {follow_up.lead.name}',
            actor=request.user,
            target=follow_up.lead,
            metadata={'follow_up_id': follow_up.pk},
        )
        return Response(LeadFollowUpSerializer(follow_up).data, status=status.HTTP_200_OK)


class GlobalActivityViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = GlobalActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['source', 'verb']
    search_fields = ['message']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return GlobalActivity.objects.none()
        return GlobalActivity.objects.select_related('actor', 'target_content_type').filter(
            organization_name=get_scope_key(self.request.user)
        )


class AutomationDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AutomationDashboardSummarySerializer)
    def get(self, request):
        data = build_dashboard_summary(request.user)
        serializer = AutomationDashboardSummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
