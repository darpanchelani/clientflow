from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import AIReport
from clientflow.apps.users.models import User


REPORT_CONTENT = {
    'title': 'Cash collection needs attention',
    'executive_summary': 'Revenue is stable, but outstanding invoices require follow-up.',
    'health_score': 72,
    'confidence': 'high',
    'key_metrics': [
        {'label': 'Revenue', 'value': '$12,400', 'context': 'Selected period', 'direction': 'up'},
        {'label': 'Outstanding', 'value': '$4,200', 'context': 'Open invoice value', 'direction': 'down'},
        {'label': 'Conversion', 'value': '24%', 'context': 'Lead to client', 'direction': 'flat'},
    ],
    'findings': [
        {'title': 'Collections exposure', 'detail': 'Open invoices need action.', 'evidence': '$4,200 outstanding', 'category': 'cash_flow', 'severity': 'warning'},
        {'title': 'Pipeline is active', 'detail': 'Qualified leads remain available.', 'evidence': '3 qualified leads', 'category': 'sales', 'severity': 'positive'},
    ],
    'next_actions': [
        {'action': 'Review overdue invoices', 'rationale': 'Protect near-term cash flow.', 'priority': 'now', 'owner': 'Finance owner'},
        {'action': 'Contact qualified leads', 'rationale': 'Move open opportunities forward.', 'priority': 'this_week', 'owner': 'Sales owner'},
    ],
    'methodology': 'Analyzed the scoped ClientFlow analytics snapshot for the selected period.',
}


@override_settings(OPENAI_API_KEY='test-key', AI_REPORT_PROVIDER='openai', OPENAI_MODEL='gpt-4o-mini')
class AIReportAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='reports@example.com',
            password='StrongPass123!',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other-reports@example.com',
            password='StrongPass123!',
            organization_name='OtherOrg',
        )

    def create_report(self, user=None):
        return AIReport.objects.create(
            user=user or self.user,
            report_type=AIReport.ReportType.OVERVIEW,
            title='Saved report',
            executive_summary='Summary',
            health_score=70,
            confidence='medium',
            key_metrics=REPORT_CONTENT['key_metrics'],
            findings=REPORT_CONTENT['findings'],
            next_actions=REPORT_CONTENT['next_actions'],
            methodology='Method',
            snapshot={'range': {'start_date': '2026-07-12', 'end_date': '2026-08-10'}},
            filters={'range': 'last_30_days'},
            period_start='2026-07-12',
            period_end='2026-08-10',
            provider='openai',
            model_name='gpt-4o-mini',
        )

    def test_unauthenticated_user_cannot_access_reports(self):
        response = self.client.get(reverse('ai:ai-report-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('clientflow.apps.ai_engine.services.report_generation_service.generate_openai_report')
    def test_generates_and_persists_structured_report(self, generate_openai_report):
        generate_openai_report.return_value = (REPORT_CONTENT, 'gpt-4o-mini')
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('ai:ai-report-generate'),
            {'report_type': 'overview', 'range': 'last_30_days'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['health_score'], 72)
        self.assertEqual(response.data['provider'], 'openai')
        self.assertEqual(AIReport.objects.filter(user=self.user).count(), 1)
        analytics_snapshot = generate_openai_report.call_args.args[1]
        self.assertIn('summary', analytics_snapshot)
        self.assertIn('sales_funnel', analytics_snapshot)

    def test_report_history_is_scoped_to_authenticated_user(self):
        self.create_report(self.user)
        self.create_report(self.other_user)
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:ai-report-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Saved report')

    def test_report_can_be_downloaded_as_pdf(self):
        report = self.create_report()
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:ai-report-download', args=[report.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.content.startswith(b'%PDF-1.4'))

    def test_custom_range_requires_both_dates(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse('ai:ai-report-generate'),
            {'report_type': 'overview', 'range': 'custom', 'start_date': '2026-08-01'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(OPENAI_API_KEY='')
    def test_configuration_reports_when_ai_is_not_connected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('ai:ai-report-configuration'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['configured'])
