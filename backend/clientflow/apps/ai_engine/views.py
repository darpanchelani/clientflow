from django.conf import settings
from django.db.models import F
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiTypes, extend_schema
from rest_framework.exceptions import APIException, ValidationError
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.clients.models import Client
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead

from .models import AIInsight, AIPrediction, AIReport, ProposalDraft
from .serializers import (
    AIInsightSerializer,
    AIPredictionSerializer,
    AIReportGenerateSerializer,
    AIReportSerializer,
    InsightGenerateSerializer,
    ProposalDraftSerializer,
    ProposalGenerateSerializer,
    ProposalSendSerializer,
)
from .services.churn_prediction_service import score_client_churn_risk
from .services.insight_service import generate_insights_for_user, list_insights_for_user, mark_all_read
from .services.lead_scoring_service import score_lead
from .services.openai_service import OpenAIUnavailable
from .services.payment_risk_service import score_invoice_payment_risk
from .services.proposal_email_service import send_proposal_email
from .services.proposal_generation_service import generate_proposal
from .services.proposal_pdf_service import generate_proposal_pdf
from .services.revenue_forecast_service import forecast_revenue
from .services.report_generation_service import generate_ai_report
from .services.report_pdf_service import generate_report_pdf


class AIPredictionViewSet(ModelViewSet):
    serializer_class = AIPredictionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['entity_type', 'entity_id', 'prediction_type']
    search_fields = ['explanation']
    ordering_fields = ['created_at', 'score', 'probability', 'confidence']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return AIPrediction.objects.none()
        return AIPrediction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AIInsightViewSet(ModelViewSet):
    serializer_class = AIInsightSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'severity', 'is_read']
    search_fields = ['title', 'description', 'recommendation']
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return AIInsight.objects.none()
        return list_insights_for_user(self.request.user, self.request.query_params)

    def get_serializer_class(self):
        if self.action == 'generate':
            return InsightGenerateSerializer
        return AIInsightSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = generate_insights_for_user(request.user)
        return Response({
            'created_count': result['created_count'],
            'count': result['count'],
            'results': AIInsightSerializer(result['results'], many=True).data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='read')
    def read(self, request, pk=None):
        insight = self.get_object()
        insight.is_read = True
        insight.save(update_fields=['is_read', 'updated_at'])
        return Response(AIInsightSerializer(insight).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = mark_all_read(request.user)
        return Response({'updated': updated}, status=status.HTTP_200_OK)


class ProposalDraftViewSet(ModelViewSet):
    serializer_class = ProposalDraftSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'proposal_type', 'client_id', 'lead_id', 'project_id']
    search_fields = ['title', 'generated_content']
    ordering_fields = ['created_at', 'updated_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ProposalDraft.objects.none()
        return ProposalDraft.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'generate':
            return ProposalGenerateSerializer
        if self.action == 'send':
            return ProposalSendSerializer
        return ProposalDraftSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(generate_proposal(user=request.user, validated_data=serializer.validated_data), status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        proposal = self.get_object()
        proposal.status = ProposalDraft.Status.APPROVED
        proposal.save(update_fields=['status', 'updated_at'])
        return Response(ProposalDraftSerializer(proposal).data)

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        proposal = self.get_object()
        proposal.status = ProposalDraft.Status.ARCHIVED
        proposal.save(update_fields=['status', 'updated_at'])
        return Response(ProposalDraftSerializer(proposal).data)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        proposal = self.get_object()
        try:
            pdf_content = generate_proposal_pdf(proposal)
        except Exception as exc:
            raise APIException('Unable to generate proposal PDF.') from exc

        ProposalDraft.objects.filter(pk=proposal.pk).update(
            last_downloaded_at=timezone.now(),
            download_count=F('download_count') + 1,
        )
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="proposal-{proposal.pk}.pdf"'
        return response

    @action(detail=True, methods=['post'], url_path='send')
    def send(self, request, pk=None):
        proposal = self.get_object()
        if proposal.status == ProposalDraft.Status.ARCHIVED:
            raise ValidationError({'detail': 'Archived proposals cannot be sent.'})

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            send_proposal_email(proposal=proposal, **serializer.validated_data)
        except Exception as exc:
            raise APIException('Unable to send proposal email.') from exc

        proposal.status = ProposalDraft.Status.SENT
        proposal.sent_at = timezone.now()
        proposal.sent_to_email = serializer.validated_data['to_email']
        proposal.save(update_fields=['status', 'sent_at', 'sent_to_email', 'updated_at'])
        return Response(ProposalDraftSerializer(proposal).data, status=status.HTTP_200_OK)


class LeadScoreView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, pk):
        lead = Lead.objects.filter(pk=pk, organization_name=get_scope_key(request.user)).first()
        if not lead:
            return Response({'detail': 'Lead not found.'}, status=404)
        return Response(score_lead(lead=lead, user=request.user))


class BulkLeadScoreView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        scope = get_scope_key(request.user)
        lead_ids = request.data.get('lead_ids') or []
        queryset = Lead.objects.filter(organization_name=scope)
        if lead_ids:
            queryset = queryset.filter(id__in=lead_ids)
        results = [score_lead(lead=lead, user=request.user) for lead in queryset[:100]]
        return Response({'count': len(results), 'results': results})


class InvoicePaymentRiskView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, pk):
        invoice = Invoice.objects.filter(pk=pk, organization_name=get_scope_key(request.user)).select_related('client').first()
        if not invoice:
            return Response({'detail': 'Invoice not found.'}, status=404)
        return Response(score_invoice_payment_risk(invoice=invoice, user=request.user))


class PaymentRiskListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=AIPredictionSerializer(many=True))
    def get(self, request):
        predictions = AIPrediction.objects.filter(
            user=request.user,
            entity_type=AIPrediction.EntityType.INVOICE,
            prediction_type=AIPrediction.PredictionType.PAYMENT_RISK,
        )
        return Response(AIPredictionSerializer(predictions, many=True).data)


class ClientChurnRiskView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, pk):
        client = Client.objects.filter(pk=pk, organization_name=get_scope_key(request.user)).first()
        if not client:
            return Response({'detail': 'Client not found.'}, status=404)
        return Response(score_client_churn_risk(client=client, user=request.user))


class ClientHealthListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        clients = Client.objects.filter(organization_name=get_scope_key(request.user)).order_by('-updated_at')[:100]
        results = [score_client_churn_risk(client=client, user=request.user) for client in clients]
        return Response({'count': len(results), 'results': results})


class RevenueForecastView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(forecast_revenue(user=request.user))


class AIReportViewSet(ModelViewSet):
    serializer_class = AIReportSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    filterset_fields = ['report_type']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return AIReport.objects.none()
        return AIReport.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'generate':
            return AIReportGenerateSerializer
        return AIReportSerializer

    @action(detail=False, methods=['get'], url_path='configuration')
    def configuration(self, request):
        configured = bool(getattr(settings, 'OPENAI_API_KEY', '')) and getattr(
            settings, 'AI_REPORT_PROVIDER', 'openai'
        ) == 'openai'
        return Response({
            'configured': configured,
            'provider': 'openai',
            'model': getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini') if configured else None,
        })

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            report = generate_ai_report(request.user, serializer.validated_data)
        except OpenAIUnavailable as exc:
            return Response(
                {'detail': str(exc), 'code': 'ai_not_configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(AIReportSerializer(report).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        report = self.get_object()
        response = HttpResponse(generate_report_pdf(report), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="clientflow-ai-report-{report.pk}.pdf"'
        return response
