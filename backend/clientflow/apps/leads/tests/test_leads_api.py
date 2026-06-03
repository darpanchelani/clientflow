from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.crm.models import Activity, Note
from clientflow.apps.users.models import User

from ..models import Lead


class LeadAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='owner@example.com',
            password=self.password,
            first_name='Owner',
            last_name='User',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password=self.password,
            first_name='Other',
            last_name='User',
            organization_name='OtherOrg',
        )
        login = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def _create_lead(self, **overrides):
        payload = {
            'name': 'Acme Prospect',
            'email': 'lead@acme.com',
            'phone': '+1-555-0100',
            'company': 'Acme Inc',
            'source': 'website',
            'status': 'new',
            'score': 42,
            'tag_names': ['priority', 'enterprise'],
        }
        payload.update(overrides)
        return self.client.post(reverse('leads:lead-list'), payload, format='json')

    def test_create_list_filter_and_search_leads(self):
        response = self._create_lead()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Acme Prospect')
        self.assertEqual(len(response.data['tags']), 2)

        self._create_lead(
            name='Referral Lead',
            email='referral@acme.com',
            source='referral',
            status='qualified',
            score=88,
        )

        list_response = self.client.get(reverse('leads:lead-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 2)

        filtered = self.client.get(reverse('leads:lead-list'), {'status': 'qualified'})
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered.data['results']), 1)
        self.assertEqual(filtered.data['results'][0]['status'], 'qualified')

        searched = self.client.get(reverse('leads:lead-list'), {'search': 'Referral'})
        self.assertEqual(searched.status_code, status.HTTP_200_OK)
        self.assertEqual(len(searched.data['results']), 1)
        self.assertEqual(searched.data['results'][0]['name'], 'Referral Lead')

    def test_update_status_notes_and_timeline(self):
        create_response = self._create_lead()
        lead_id = create_response.data['id']

        update_response = self.client.put(
            reverse('leads:lead-detail', args=[lead_id]),
            {
                'name': 'Acme Prospect Updated',
                'email': 'lead@acme.com',
                'phone': '+1-555-0101',
                'company': 'Acme Inc',
                'source': 'website',
                'status': 'contacted',
                'score': 55,
                'tag_names': ['priority'],
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['status'], 'contacted')

        status_response = self.client.patch(
            reverse('leads:lead-update-status', args=[lead_id]),
            {'status': 'qualified'},
            format='json',
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data['status'], 'qualified')

        note_response = self.client.post(
            reverse('leads:lead-notes', args=[lead_id]),
            {'body': 'Call scheduled for tomorrow.'},
            format='json',
        )
        self.assertEqual(note_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 1)
        self.assertEqual(Activity.objects.filter(action=Activity.Action.NOTE_ADDED).count(), 1)

        timeline_response = self.client.get(reverse('leads:lead-timeline', args=[lead_id]))
        self.assertEqual(timeline_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(timeline_response.data), 2)
        self.assertIn(timeline_response.data[0]['item_type'], {'activity', 'note'})

    def test_delete_lead(self):
        create_response = self._create_lead()
        lead_id = create_response.data['id']
        delete_response = self.client.delete(reverse('leads:lead-detail', args=[lead_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Lead.objects.filter(pk=lead_id).exists())

