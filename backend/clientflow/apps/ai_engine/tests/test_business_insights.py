from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import AIInsight
from clientflow.apps.clients.models import Client
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.notifications.models import Notification
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task
from clientflow.apps.users.models import User


class AIBusinessInsightsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='insights@example.com',
            password='StrongPass123!',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other-insights@example.com',
            password='StrongPass123!',
            organization_name='OtherOrg',
        )
        self.client_obj = Client.objects.create(
            name='Acme',
            email='acme@example.com',
            company='Acme',
            owner=self.user,
            organization_name='ClientFlow',
        )
        self.project = Project.objects.create(
            name='Delivery Project',
            client=self.client_obj,
            owner=self.user,
            status=Project.Status.ACTIVE,
            end_date=timezone.localdate() + timezone.timedelta(days=5),
        )

    def create_overdue_invoice(self):
        return Invoice.objects.create(
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

    def create_stale_lead(self):
        lead = Lead.objects.create(
            name='Stale Lead',
            email='stale@example.com',
            company='Stale Co',
            source=Lead.Source.WEBSITE,
            status=Lead.Status.QUALIFIED,
            score=82,
            owner=self.user,
            organization_name='ClientFlow',
        )
        Lead.objects.filter(pk=lead.pk).update(created_at=timezone.now() - timezone.timedelta(days=10))
        lead.refresh_from_db()
        return lead

    def create_overdue_task(self):
        return Task.objects.create(
            title='Overdue implementation task',
            project=self.project,
            assigned_to=self.user,
            status=Task.Status.IN_PROGRESS,
            priority=Task.Priority.HIGH,
            due_date=timezone.localdate() - timezone.timedelta(days=2),
        )

    def create_revenue_decline_data(self):
        previous_month = timezone.localdate().replace(day=1) - timezone.timedelta(days=1)
        invoice = Invoice.objects.create(
            client=self.client_obj,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            status=Invoice.Status.PAID,
            issue_date=previous_month.replace(day=1),
            due_date=previous_month,
            subtotal=Decimal('8000.00'),
            tax=Decimal('0.00'),
            total=Decimal('8000.00'),
            paid_at=timezone.now() - timezone.timedelta(days=35),
        )
        Payment.objects.create(
            invoice=invoice,
            amount=Decimal('8000.00'),
            payment_method=Payment.Method.CARD,
            status=Payment.Status.COMPLETED,
            paid_at=timezone.make_aware(timezone.datetime.combine(previous_month, timezone.datetime.min.time())),
            created_by=self.user,
        )

    def test_authenticated_user_can_generate_insights(self):
        self.create_overdue_invoice()
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)
        self.assertGreater(AIInsight.objects.filter(user=self.user).count(), 0)

    def test_unauthenticated_user_cannot_access_insights(self):
        response = self.client.get(reverse('ai:insight-list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_only_sees_their_own_insights(self):
        AIInsight.objects.create(
            user=self.user,
            title='Visible',
            description='Visible insight',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        AIInsight.objects.create(
            user=self.other_user,
            title='Hidden',
            description='Hidden insight',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:insight-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in response.data['results']]
        self.assertEqual(titles, ['Visible'])

    def test_duplicate_insight_is_not_created_repeatedly(self):
        self.create_overdue_invoice()
        self.client.force_authenticate(user=self.user)

        first = self.client.post(reverse('ai:insight-generate'), {}, format='json')
        second = self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.data['created_count'], 0)

    def test_overdue_invoice_creates_critical_insight(self):
        self.create_overdue_invoice()
        self.client.force_authenticate(user=self.user)

        self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertTrue(AIInsight.objects.filter(
            user=self.user,
            category=AIInsight.Category.INVOICE,
            severity=AIInsight.Severity.CRITICAL,
            title='Overdue invoice critical alert',
        ).exists())

    def test_stale_lead_creates_lead_insight(self):
        self.create_stale_lead()
        self.client.force_authenticate(user=self.user)

        self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertTrue(AIInsight.objects.filter(
            user=self.user,
            category=AIInsight.Category.LEAD,
            title='Stale lead warning',
        ).exists())

    def test_overdue_task_creates_task_insight(self):
        self.create_overdue_task()
        self.client.force_authenticate(user=self.user)

        self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertTrue(AIInsight.objects.filter(
            user=self.user,
            category=AIInsight.Category.TASK,
            title='Overdue task critical',
        ).exists())

    def test_revenue_decline_creates_revenue_warning(self):
        self.create_revenue_decline_data()
        self.client.force_authenticate(user=self.user)

        self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertTrue(AIInsight.objects.filter(
            user=self.user,
            category=AIInsight.Category.REVENUE,
            title='Revenue decline warning',
        ).exists())

    def test_mark_insight_as_read_works(self):
        insight = AIInsight.objects.create(
            user=self.user,
            title='Unread',
            description='Unread insight',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(reverse('ai:insight-read', args=[insight.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        insight.refresh_from_db()
        self.assertTrue(insight.is_read)

    def test_mark_all_as_read_works(self):
        AIInsight.objects.create(
            user=self.user,
            title='Unread A',
            description='Unread A',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        AIInsight.objects.create(
            user=self.user,
            title='Unread B',
            description='Unread B',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(reverse('ai:insight-mark-all-read'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated'], 2)
        self.assertFalse(AIInsight.objects.filter(user=self.user, is_read=False).exists())

    def test_delete_insight_works(self):
        insight = AIInsight.objects.create(
            user=self.user,
            title='Delete me',
            description='Delete insight',
            category=AIInsight.Category.SYSTEM,
            severity=AIInsight.Severity.INFO,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.delete(reverse('ai:insight-detail', args=[insight.pk]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(AIInsight.objects.filter(pk=insight.pk).exists())

    def test_critical_or_warning_insight_creates_notification(self):
        self.create_overdue_invoice()
        self.client.force_authenticate(user=self.user)

        self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertTrue(Notification.objects.filter(
            user=self.user,
            title='Overdue invoice critical alert',
        ).exists())

    def test_empty_account_returns_safe_empty_list(self):
        empty_user = User.objects.create_user(
            email='empty-insights@example.com',
            password='StrongPass123!',
            organization_name='EmptyOrg',
        )
        self.client.force_authenticate(user=empty_user)

        response = self.client.post(reverse('ai:insight-generate'), {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])
