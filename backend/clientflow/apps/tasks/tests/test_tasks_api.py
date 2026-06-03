from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.clients.models import Client
from clientflow.apps.users.models import User

from clientflow.apps.projects.models import Project
from ..models import Task


class TaskAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.owner = User.objects.create_user(
            email='owner@example.com',
            password=self.password,
            first_name='Task',
            last_name='Owner',
            organization_name='ClientFlow',
        )
        self.assignee = User.objects.create_user(
            email='assignee@example.com',
            password=self.password,
            first_name='Task',
            last_name='Assignee',
            organization_name='ClientFlow',
        )
        self.other_org_user = User.objects.create_user(
            email='other@example.com',
            password=self.password,
            first_name='Other',
            last_name='User',
            organization_name='OtherOrg',
        )
        self.client_record = Client.objects.create(
            name='Acme Client',
            email='client@acme.com',
            phone='+1-555-1000',
            company='Acme Inc',
            status='active',
            owner=self.owner,
            organization_name='ClientFlow',
        )
        self.project = Project.objects.create(
            name='Website Redesign',
            description='Refresh the main product website.',
            client=self.client_record,
            owner=self.owner,
            status='active',
        )
        login = self.client.post(
            reverse('auth:login'),
            {'email': self.owner.email, 'password': self.password},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_task_crud_status_assign_and_board(self):
        create_response = self.client.post(
            reverse('tasks:task-list'),
            {
                'title': 'Design header section',
                'description': 'Create new hero and navigation.',
                'project_id': self.project.id,
                'assigned_to_id': self.assignee.id,
                'status': 'todo',
                'priority': 'high',
                'due_date': '2026-06-20',
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        task_id = create_response.data['id']

        list_response = self.client.get(reverse('tasks:task-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 1)

        status_response = self.client.patch(
            reverse('tasks:task-update-status', args=[task_id]),
            {'status': 'in_progress'},
            format='json',
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(status_response.data['status'], 'in_progress')

        assign_response = self.client.patch(
            reverse('tasks:task-assign', args=[task_id]),
            {'assigned_to_id': self.assignee.id},
            format='json',
        )
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)

        board_response = self.client.get(reverse('tasks:task-board'), {'project': self.project.id})
        self.assertEqual(board_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(board_response.data['in_progress']), 1)

        activity_response = self.client.get(reverse('tasks:task-activity', args=[task_id]))
        self.assertEqual(activity_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(activity_response.data), 2)

        delete_response = self.client.delete(reverse('tasks:task-detail', args=[task_id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=task_id).exists())

    def test_reject_cross_org_assignment(self):
        create_response = self.client.post(
            reverse('tasks:task-list'),
            {
                'title': 'QA sign off',
                'description': 'Check release readiness.',
                'project_id': self.project.id,
                'assigned_to_id': self.assignee.id,
                'status': 'todo',
                'priority': 'medium',
            },
            format='json',
        )
        task_id = create_response.data['id']
        bad_assign = self.client.patch(
            reverse('tasks:task-assign', args=[task_id]),
            {'assigned_to_id': self.other_org_user.id},
            format='json',
        )
        self.assertEqual(bad_assign.status_code, status.HTTP_400_BAD_REQUEST)

