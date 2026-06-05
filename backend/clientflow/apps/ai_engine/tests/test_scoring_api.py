from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import AIPrediction
from clientflow.apps.automation.models import LeadFollowUp
from clientflow.apps.clients.models import Client
from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import add_note, log_activity
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project
from clientflow.apps.users.models import User


class AIScoringAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='scoring@example.com',
            password='StrongPass123!',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='StrongPass123!',
            organization_name='OtherOrg',
        )
        self.lead = Lead.objects.create(
            name='High Intent Lead',
            email='lead@example.com',
            phone='+15555550100',
            company='Acme',
            source=Lead.Source.REFERRAL,
            status=Lead.Status.QUALIFIED,
            score=0,
            owner=self.user,
            organization_name='ClientFlow',
        )
        log_activity(
            target=self.lead,
            action=Activity.Action.CREATED,
            actor=self.user,
            message='Lead created',
        )
        add_note(target=self.lead, body='Asked for proposal timeline.', author=self.user)
        LeadFollowUp.objects.create(
            lead=self.lead,
            assigned_user=self.user,
            due_date=timezone.localdate(),
            notes='Call today',
        )
        self.client_obj = Client.objects.create(
            name='Acme',
            email='client@example.com',
            phone='+15555550101',
            company='Acme',
            owner=self.user,
            organization_name='ClientFlow',
        )
        self.project = Project.objects.create(
            name='Website',
            client=self.client_obj,
            owner=self.user,
            status=Project.Status.ACTIVE,
        )
        self.invoice = Invoice.objects.create(
            client=self.client_obj,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            status=Invoice.Status.OVERDUE,
            issue_date=timezone.localdate() - timezone.timedelta(days=45),
            due_date=timezone.localdate() - timezone.timedelta(days=10),
            subtotal=Decimal('2500.00'),
            tax=Decimal('0.00'),
            total=Decimal('2500.00'),
        )

    def test_lead_score_generation_stores_prediction(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:lead-score', args=[self.lead.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['score'], 0)
        self.assertLessEqual(response.data['score'], 100)
        self.assertEqual(response.data['priority'], 'high')
        self.assertEqual(AIPrediction.objects.filter(prediction_type=AIPrediction.PredictionType.LEAD_SCORE).count(), 1)

    def test_bulk_lead_scoring(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai_engine:bulk-lead-score'), {'lead_ids': [self.lead.pk]}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(AIPrediction.objects.filter(prediction_type=AIPrediction.PredictionType.LEAD_SCORE).count(), 1)

    def test_payment_risk_generation_stores_prediction(self):
        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('100.00'),
            payment_method=Payment.Method.CARD,
            status=Payment.Status.COMPLETED,
            paid_at=timezone.now(),
            created_by=self.user,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:invoice-payment-risk', args=[self.invoice.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['risk_score'], 0)
        self.assertIn(response.data['risk_level'], ['low', 'medium', 'high'])
        self.assertEqual(AIPrediction.objects.filter(prediction_type=AIPrediction.PredictionType.PAYMENT_RISK).count(), 1)

    def test_payment_risk_history_lists_stored_predictions(self):
        self.client.force_authenticate(user=self.user)
        self.client.get(reverse('ai_engine:invoice-payment-risk', args=[self.invoice.pk]))

        response = self.client.get(reverse('ai_engine:payment-risks'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_missing_record_handling(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:lead-score', args=[99999]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_permission_protection(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(reverse('ai_engine:lead-score', args=[self.lead.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_cannot_score(self):
        response = self.client.get(reverse('ai_engine:lead-score', args=[self.lead.pk]))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
