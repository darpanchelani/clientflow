from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import AIInsight, AIPrediction
from clientflow.apps.users.models import User


class AIEngineAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='ai-user@example.com',
            password='StrongPass123!',
            first_name='AI',
            last_name='User',
            organization_name='ClientFlow',
        )

    def test_unauthenticated_user_cannot_access_ai_endpoints(self):
        response = self.client.get(reverse('ai:prediction-list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_access_ai_endpoints(self):
        self.client.force_authenticate(user=self.user)

        predictions_response = self.client.get(reverse('ai:prediction-list'))
        insights_response = self.client.get(reverse('ai:insight-list'))
        proposals_response = self.client.get(reverse('ai:proposal-list'))

        self.assertEqual(predictions_response.status_code, status.HTTP_200_OK)
        self.assertEqual(insights_response.status_code, status.HTTP_200_OK)
        self.assertEqual(proposals_response.status_code, status.HTTP_200_OK)

    def test_prediction_records_can_be_created(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'entity_type': AIPrediction.EntityType.LEAD,
            'entity_id': 1,
            'prediction_type': AIPrediction.PredictionType.LEAD_SCORE,
            'score': '82.50',
            'probability': '0.8200',
            'confidence': '0.7600',
            'result': {'label': 'high_intent'},
            'explanation': 'Foundation test prediction.',
        }

        response = self.client.post(reverse('ai:prediction-list'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AIPrediction.objects.count(), 1)
        self.assertEqual(AIPrediction.objects.first().user, self.user)

    def test_insights_can_be_listed(self):
        AIInsight.objects.create(
            user=self.user,
            title='Pipeline risk',
            description='Several leads need follow-up.',
            category=AIInsight.Category.SALES,
            severity=AIInsight.Severity.MEDIUM,
            recommendation='Review qualified leads.',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:insight-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['title'], 'Pipeline risk')
