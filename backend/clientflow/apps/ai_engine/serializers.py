from rest_framework import serializers

from clientflow.apps.clients.models import Client
from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.leads.models import Lead
from clientflow.apps.projects.models import Project

from .models import AIInsight, AIPrediction, AIReport, ProposalDraft


class AIPredictionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = AIPrediction
        fields = (
            'id',
            'user',
            'user_email',
            'entity_type',
            'entity_id',
            'prediction_type',
            'score',
            'probability',
            'confidence',
            'result',
            'explanation',
            'created_at',
        )
        read_only_fields = ('id', 'user', 'user_email', 'created_at')


class AIInsightSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = AIInsight
        fields = (
            'id',
            'user',
            'user_email',
            'title',
            'description',
            'category',
            'severity',
            'recommendation',
            'source_type',
            'source_id',
            'score',
            'metadata',
            'is_read',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'user_email', 'created_at', 'updated_at')


class InsightGenerateSerializer(serializers.Serializer):
    refresh = serializers.BooleanField(required=False, default=True)


class ProposalDraftSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    source = serializers.CharField(read_only=True)
    lead_summary = serializers.SerializerMethodField()
    client_summary = serializers.SerializerMethodField()
    project_summary = serializers.SerializerMethodField()

    class Meta:
        model = ProposalDraft
        fields = (
            'id',
            'user',
            'user_email',
            'client',
            'client_summary',
            'lead',
            'lead_summary',
            'project',
            'project_summary',
            'title',
            'generated_content',
            'status',
            'proposal_type',
            'estimated_budget',
            'estimated_timeline',
            'services_offered',
            'client_problem',
            'proposed_solution',
            'sent_at',
            'sent_to_email',
            'last_downloaded_at',
            'download_count',
            'source',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'user',
            'user_email',
            'source',
            'lead_summary',
            'client_summary',
            'project_summary',
            'sent_at',
            'sent_to_email',
            'last_downloaded_at',
            'download_count',
            'created_at',
            'updated_at',
        )

    def get_lead_summary(self, obj):
        if not obj.lead_id:
            return None
        return {
            'id': obj.lead_id,
            'name': obj.lead.name,
            'email': obj.lead.email,
            'company': obj.lead.company,
        }

    def get_client_summary(self, obj):
        if not obj.client_id:
            return None
        return {
            'id': obj.client_id,
            'name': obj.client.name,
            'email': obj.client.email,
            'company': obj.client.company,
        }

    def get_project_summary(self, obj):
        if not obj.project_id:
            return None
        return {
            'id': obj.project_id,
            'name': obj.project.name,
        }


class ProposalGenerateSerializer(serializers.Serializer):
    class Tone(serializers.ChoiceField):
        def __init__(self, **kwargs):
            super().__init__(
                choices=('professional', 'friendly', 'persuasive', 'formal'),
                **kwargs,
            )

    lead_id = serializers.IntegerField(required=False, allow_null=True)
    client_id = serializers.IntegerField(required=False, allow_null=True)
    project_id = serializers.IntegerField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255)
    proposal_type = serializers.ChoiceField(choices=ProposalDraft.ProposalType.choices)
    estimated_budget = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    estimated_timeline = serializers.CharField(max_length=255, required=False, allow_blank=True)
    services_offered = serializers.CharField()
    client_problem = serializers.CharField(required=False, allow_blank=True)
    proposed_solution = serializers.CharField(required=False, allow_blank=True)
    tone = Tone(required=False, default='professional')
    include_payment_terms = serializers.BooleanField(required=False, default=True)
    include_timeline = serializers.BooleanField(required=False, default=True)
    include_deliverables = serializers.BooleanField(required=False, default=True)

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        for field in ('lead_id', 'client_id', 'project_id'):
            if data.get(field) == '':
                data[field] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs.get('estimated_budget') is not None and attrs['estimated_budget'] < 0:
            raise serializers.ValidationError({'estimated_budget': 'Estimated budget cannot be negative.'})

        if not attrs.get('client_problem') and not any(
            attrs.get(field) for field in ('lead_id', 'client_id', 'project_id')
        ):
            raise serializers.ValidationError(
                'Provide at least one of lead_id, client_id, project_id, or client_problem.'
            )

        request = self.context.get('request')
        user = request.user if request else None
        scope = get_scope_key(user) if user and user.is_authenticated else ''

        lead_id = attrs.get('lead_id')
        if lead_id:
            lead = Lead.objects.filter(pk=lead_id, organization_name=scope).first()
            if not lead:
                raise serializers.ValidationError({'lead_id': 'Selected lead was not found.'})
            attrs['lead'] = lead

        client_id = attrs.get('client_id')
        if client_id:
            client = Client.objects.filter(pk=client_id, organization_name=scope).first()
            if not client:
                raise serializers.ValidationError({'client_id': 'Selected client was not found.'})
            attrs['client'] = client

        project_id = attrs.get('project_id')
        if project_id:
            project = Project.objects.filter(pk=project_id, client__organization_name=scope).select_related('client').first()
            if not project:
                raise serializers.ValidationError({'project_id': 'Selected project was not found.'})
            attrs['project'] = project
            attrs.setdefault('client', project.client)

        return attrs


class ProposalSendSerializer(serializers.Serializer):
    to_email = serializers.EmailField()
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField(required=False, allow_blank=True, default='')
    attach_pdf = serializers.BooleanField(required=False, default=True)


class AIReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIReport
        fields = (
            'id',
            'report_type',
            'title',
            'executive_summary',
            'health_score',
            'confidence',
            'key_metrics',
            'findings',
            'next_actions',
            'methodology',
            'snapshot',
            'filters',
            'period_start',
            'period_end',
            'provider',
            'model_name',
            'created_at',
        )
        read_only_fields = fields


class AIReportGenerateSerializer(serializers.Serializer):
    report_type = serializers.ChoiceField(choices=AIReport.ReportType.choices, default=AIReport.ReportType.OVERVIEW)
    range = serializers.ChoiceField(
        choices=('today', 'last_7_days', 'last_30_days', 'last_quarter', 'custom'),
        default='last_30_days',
    )
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    client = serializers.IntegerField(required=False, min_value=1)
    project = serializers.IntegerField(required=False, min_value=1)
    team_member = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        if attrs.get('range') == 'custom' and not attrs.get('start_date'):
            raise serializers.ValidationError({'start_date': 'Choose a start date for a custom range.'})
        if attrs.get('range') == 'custom' and not attrs.get('end_date'):
            raise serializers.ValidationError({'end_date': 'Choose an end date for a custom range.'})
        if attrs.get('start_date') and attrs.get('end_date') and attrs['start_date'] > attrs['end_date']:
            raise serializers.ValidationError({'end_date': 'End date must be on or after the start date.'})
        return attrs
