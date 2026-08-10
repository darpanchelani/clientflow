from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.users.models import User


class UserListAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='maya@example.com',
            password='StrongPass123!',
            first_name='Maya',
            organization_name='Northstar',
        )
        User.objects.create_user(
            email='alex@example.com',
            password='StrongPass123!',
            first_name='Alex',
            organization_name='Northstar',
        )
        User.objects.create_user(
            email='outside@example.com',
            password='StrongPass123!',
            first_name='Outside',
            organization_name='Other company',
        )
        self.client.force_authenticate(self.user)

    def test_list_is_paginated_ordered_and_workspace_scoped(self):
        response = self.client.get(reverse('users:user-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [result['email'] for result in response.data['results']],
            ['alex@example.com', 'maya@example.com'],
        )

    def test_explicit_ordering_is_supported(self):
        response = self.client.get(reverse('users:user-list'), {'ordering': '-email'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [result['email'] for result in response.data['results']],
            ['maya@example.com', 'alex@example.com'],
        )
