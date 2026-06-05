from rest_framework import serializers

from clientflow.apps.leads.serializers import LeadSerializer
from clientflow.apps.users.serializers import UserBriefSerializer

from .models import AutomationPreference, GlobalActivity, LeadFollowUp, WorkflowRule


class WorkflowRuleSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = WorkflowRule
        fields = (
            'id',
            'name',
            'trigger_type',
            'action_type',
            'is_active',
            'conditions',
            'action_config',
            'organization_name',
            'created_by',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'organization_name', 'created_by', 'created_at', 'updated_at')


class AutomationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationPreference
        fields = (
            'id',
            'in_app_notifications_enabled',
            'email_notifications_enabled',
            'lead_follow_up_days',
            'task_due_soon_hours',
            'invoice_before_due_days',
            'invoice_after_overdue_days',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class LeadFollowUpSerializer(serializers.ModelSerializer):
    lead = LeadSerializer(read_only=True)
    assigned_user = UserBriefSerializer(read_only=True)
    assigned_user_id = serializers.IntegerField(write_only=True, required=False)
    lead_id = serializers.IntegerField(write_only=True, required=False)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = LeadFollowUp
        fields = (
            'id',
            'lead',
            'lead_id',
            'assigned_user',
            'assigned_user_id',
            'due_date',
            'status',
            'notes',
            'is_overdue',
            'completed_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'lead', 'assigned_user', 'is_overdue', 'completed_at', 'created_at', 'updated_at')

    def get_is_overdue(self, obj):
        from django.utils import timezone

        return obj.status == LeadFollowUp.Status.PENDING and obj.due_date < timezone.localdate()


class LeadFollowUpCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadFollowUp
        fields = ('lead', 'assigned_user', 'due_date', 'status', 'notes')


class GlobalActivitySerializer(serializers.ModelSerializer):
    actor = UserBriefSerializer(read_only=True)
    target_type = serializers.SerializerMethodField()

    class Meta:
        model = GlobalActivity
        fields = (
            'id',
            'actor',
            'organization_name',
            'source',
            'verb',
            'message',
            'target_type',
            'target_object_id',
            'metadata',
            'created_at',
        )
        read_only_fields = fields

    def get_target_type(self, obj):
        if not obj.target_content_type_id:
            return None
        return obj.target_content_type.model


class AutomationDashboardSummarySerializer(serializers.Serializer):
    overdue_invoices = serializers.IntegerField()
    upcoming_tasks = serializers.IntegerField()
    pending_follow_ups = serializers.IntegerField()
    overdue_follow_ups = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    revenue_summary = serializers.DecimalField(max_digits=12, decimal_places=2)
