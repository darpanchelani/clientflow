from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import AIPrediction
from clientflow.apps.clients.models import Client
from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import add_note, log_activity
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project
from clientflow.apps.users.models import User


class AIClientRevenueAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='client-ai@example.com',
            password='StrongPass123!',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other-client-ai@example.com',
            password='StrongPass123!',
            organization_name='OtherOrg',
        )
        self.client_obj = Client.objects.create(
            name='Acme',
            email='acme@example.com',
            phone='+15555550001',
            company='Acme',
            owner=self.user,
            organization_name='ClientFlow',
        )
        log_activity(
            target=self.client_obj,
            action=Activity.Action.CREATED,
            actor=self.user,
            message='Client created',
        )
        add_note(target=self.client_obj, body='Quarterly review completed.', author=self.user)
        self.project = Project.objects.create(
            name='Retainer',
            client=self.client_obj,
            owner=self.user,
            status=Project.Status.ACTIVE,
        )
        self.invoice = Invoice.objects.create(
            client=self.client_obj,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            status=Invoice.Status.PAID,
            issue_date=timezone.localdate().replace(day=1),
            due_date=timezone.localdate() + timezone.timedelta(days=10),
            subtotal=Decimal('1200.00'),
            tax=Decimal('0.00'),
            total=Decimal('1200.00'),
            paid_at=timezone.now(),
        )
        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal('1200.00'),
            payment_method=Payment.Method.CARD,
            status=Payment.Status.COMPLETED,
            paid_at=timezone.now(),
            created_by=self.user,
        )
        self.overdue_invoice = Invoice.objects.create(
            client=self.client_obj,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            status=Invoice.Status.OVERDUE,
            issue_date=timezone.localdate() - timezone.timedelta(days=50),
            due_date=timezone.localdate() - timezone.timedelta(days=15),
            subtotal=Decimal('800.00'),
            tax=Decimal('0.00'),
            total=Decimal('800.00'),
        )

    def test_client_churn_risk(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:client-churn-risk', args=[self.client_obj.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['churn_score'], 0)
        self.assertLessEqual(response.data['health_score'], 100)
        self.assertIn(response.data['risk_level'], ['low', 'medium', 'high'])
        self.assertEqual(AIPrediction.objects.filter(prediction_type=AIPrediction.PredictionType.CHURN_RISK).count(), 1)

    def test_client_health_list(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:client-health'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['results']), 1)

    def test_revenue_forecast(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai_engine:revenue-forecast'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('projected_monthly_revenue', response.data)
        self.assertIn(response.data['trend_direction'], ['up', 'down', 'flat'])
        self.assertNotEqual(response.data['confidence'], 'low')

    def test_empty_data_handling(self):
        empty_user = User.objects.create_user(
            email='empty-ai@example.com',
            password='StrongPass123!',
            organization_name='EmptyOrg',
        )
        self.client.force_authenticate(user=empty_user)

        health_response = self.client.get(reverse('ai_engine:client-health'))
        forecast_response = self.client.get(reverse('ai_engine:revenue-forecast'))

        self.assertEqual(health_response.status_code, status.HTTP_200_OK)
        self.assertEqual(health_response.data['count'], 0)
        self.assertEqual(forecast_response.status_code, status.HTTP_200_OK)
        self.assertEqual(forecast_response.data['confidence'], 'low')
        self.assertEqual(forecast_response.data['projected_monthly_revenue'], '0.00')

    def test_permission_protection(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(reverse('ai_engine:client-churn-risk', args=[self.client_obj.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_user_cannot_access_revenue_forecast(self):
        response = self.client.get(reverse('ai_engine:revenue-forecast'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
