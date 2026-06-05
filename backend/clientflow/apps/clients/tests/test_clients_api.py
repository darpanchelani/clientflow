from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.crm.models import Activity, Note
from clientflow.apps.users.models import User

from clientflow.apps.leads.models import Lead

from ..models import Client


class ClientAPITests(APITestCase):
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
            email='other-owner@example.com',
            password=self.password,
            first_name='Other',
            last_name='Owner',
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
            'name': 'Lead To Convert',
            'email': 'lead@clientflow.com',
            'phone': '+1-555-0200',
            'company': 'ClientFlow Prospect',
            'source': 'referral',
            'status': 'qualified',
            'score': 80,
            'tag_names': ['conversion'],
        }
        payload.update(overrides)
        response = self.client.post(reverse('leads:lead-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data

    def test_create_list_update_and_delete_clients(self):
        lead = self._create_lead()
        response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'ClientFlow Prospect',
                'email': 'client@clientflow.com',
                'phone': '+1-555-0300',
                'company': 'ClientFlow LLC',
                'status': 'active',
                'lead_id': lead['id'],
                'tag_names': ['vip', 'retainer'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['lead']['id'], lead['id'])
        self.assertEqual(Client.objects.count(), 1)
        self.assertEqual(Lead.objects.get(pk=lead['id']).status, 'won')

        list_response = self.client.get(reverse('clients:client-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 1)

        filtered = self.client.get(reverse('clients:client-list'), {'status': 'active'})
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered.data['results']), 1)

        client_id = response.data['id']
        update_response = self.client.put(
            reverse('clients:client-detail', args=[client_id]),
            {
                'name': 'ClientFlow Customer',
                'email': 'client@clientflow.com',
                'phone': '+1-555-0301',
                'company': 'ClientFlow LLC',
                'status': 'inactive',
                'lead_id': lead['id'],
                'tag_names': ['vip'],
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['status'], 'inactive')

        note_response = self.client.post(
            reverse('clients:client-notes', args=[client_id]),
            {'body': 'Customer onboarding complete.'},
            format='json',
        )
        self.assertEqual(note_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.count(), 1)
        self.assertEqual(Activity.objects.filter(action=Activity.Action.NOTE_ADDED).count(), 1)

        timeline_response = self.client.get(reverse('clients:client-timeline', args=[client_id]))
        self.assertEqual(timeline_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(timeline_response.data), 2)

        delete_response = self.client.delete(reverse('clients:client-detail', args=[client_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Client.objects.filter(pk=client_id).exists())

    def test_lead_can_only_convert_once(self):
        lead = self._create_lead()
        first_response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'First Client',
                'email': 'client@clientflow.com',
                'phone': '+1-555-0400',
                'company': 'ClientFlow LLC',
                'status': 'active',
                'lead_id': lead['id'],
                'tag_names': [],
            },
            format='json',
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        second_response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'Second Client',
                'email': 'client2@clientflow.com',
                'phone': '+1-555-0401',
                'company': 'ClientFlow LLC',
                'status': 'active',
                'lead_id': lead['id'],
                'tag_names': [],
            },
            format='json',
        )
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_string_lead_id_creates_client_without_lead(self):
        response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'Direct Client',
                'email': 'direct@clientflow.com',
                'phone': '+1-555-0500',
                'company': 'Direct LLC',
                'status': 'active',
                'lead_id': '',
                'tag_names': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['lead'])

    def test_invalid_lead_id_returns_friendly_error(self):
        response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'Invalid Lead Client',
                'email': 'invalid@clientflow.com',
                'phone': '+1-555-0501',
                'company': 'Invalid LLC',
                'status': 'active',
                'lead_id': 999999,
                'tag_names': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Selected lead was not found.', str(response.data['fields']['lead_id']))

    def test_other_organization_lead_id_returns_friendly_error(self):
        other_lead = Lead.objects.create(
            name='Other Lead',
            email='other-lead@example.com',
            company='Other Org',
            owner=self.other_user,
            organization_name='OtherOrg',
        )

        response = self.client.post(
            reverse('clients:client-list'),
            {
                'name': 'Blocked Client',
                'email': 'blocked@clientflow.com',
                'phone': '+1-555-0502',
                'company': 'Blocked LLC',
                'status': 'active',
                'lead_id': other_lead.pk,
                'tag_names': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Selected lead was not found.', str(response.data['fields']['lead_id']))
