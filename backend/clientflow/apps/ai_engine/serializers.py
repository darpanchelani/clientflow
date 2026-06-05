from rest_framework import serializers

from clientflow.apps.clients.models import Client
from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.leads.models import Lead
from clientflow.apps.projects.models import Project

from .models import AIInsight, AIPrediction, ProposalDraft


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

    class Meta:
        model = ProposalDraft
        fields = (
            'id',
            'user',
            'user_email',
            'client',
            'lead',
            'project',
            'title',
            'generated_content',
            'status',
            'proposal_type',
            'estimated_budget',
            'estimated_timeline',
            'services_offered',
            'client_problem',
            'proposed_solution',
            'source',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'user_email', 'source', 'created_at', 'updated_at')


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
                raise serializers.ValidationError({'lead_id': 'Lead not found or not accessible.'})
            attrs['lead'] = lead

        client_id = attrs.get('client_id')
        if client_id:
            client = Client.objects.filter(pk=client_id, organization_name=scope).first()
            if not client:
                raise serializers.ValidationError({'client_id': 'Client not found or not accessible.'})
            attrs['client'] = client

        project_id = attrs.get('project_id')
        if project_id:
            project = Project.objects.filter(pk=project_id, client__organization_name=scope).select_related('client').first()
            if not project:
                raise serializers.ValidationError({'project_id': 'Project not found or not accessible.'})
            attrs['project'] = project
            attrs.setdefault('client', project.client)

        return attrs
