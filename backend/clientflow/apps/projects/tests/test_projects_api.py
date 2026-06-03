from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.clients.models import Client
from clientflow.apps.users.models import User

from ..models import Project


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='owner@example.com',
            password=self.password,
            first_name='Project',
            last_name='Owner',
            organization_name='ClientFlow',
        )
        self.client_record = Client.objects.create(
            name='Acme Client',
            email='client@acme.com',
            phone='+1-555-1000',
            company='Acme Inc',
            status='active',
            owner=self.user,
            organization_name='ClientFlow',
        )
        login = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_list_filter_update_delete_project(self):
        create_response = self.client.post(
            reverse('projects:project-list'),
            {
                'name': 'Website Redesign',
                'description': 'Refresh the main product website.',
                'client_id': self.client_record.id,
                'status': 'active',
                'start_date': '2026-06-01',
                'end_date': '2026-07-15',
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        project_id = create_response.data['id']
        self.assertEqual(create_response.data['client']['id'], self.client_record.id)

        list_response = self.client.get(reverse('projects:project-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 1)

        filtered_response = self.client.get(reverse('projects:project-list'), {'status': 'active'})
        self.assertEqual(filtered_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered_response.data['results']), 1)

        update_response = self.client.put(
            reverse('projects:project-detail', args=[project_id]),
            {
                'name': 'Website Redesign Updated',
                'description': 'Refresh the main product website with new copy.',
                'client_id': self.client_record.id,
                'status': 'paused',
                'start_date': '2026-06-01',
                'end_date': '2026-08-01',
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['status'], 'paused')

        delete_response = self.client.delete(reverse('projects:project-detail', args=[project_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(pk=project_id).exists())

