from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.users.models import User


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='existing@example.com',
            password=self.password,
            first_name='Existing',
            last_name='User',
            organization_name='ClientFlow',
        )

    def test_register_returns_tokens_and_user(self):
        payload = {
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'organization_name': 'ClientFlow',
        }

        response = self.client.post(reverse('auth:register'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], payload['email'])
        self.assertEqual(response.data['user']['role'], 'user')

    def test_login_returns_tokens_and_user(self):
        payload = {
            'email': self.user.email,
            'password': self.password,
        }

        response = self.client.post(reverse('auth:login'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], self.user.email)

    def test_profile_returns_authenticated_user(self):
        login_response = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        access = login_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        response = self.client.get(reverse('auth:profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['role'], self.user.role)

    def test_refresh_rotates_token_pair(self):
        login_response = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        refresh = login_response.data['refresh']

        response = self.client.post(
            reverse('auth:refresh'),
            {'refresh': refresh},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertNotEqual(response.data['refresh'], refresh)

    def test_logout_blacklists_refresh_token(self):
        login_response = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        refresh = login_response.data['refresh']

        logout_response = self.client.post(
            reverse('auth:logout'),
            {'refresh': refresh},
            format='json',
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(
            reverse('auth:refresh'),
            {'refresh': refresh},
            format='json',
        )
        self.assertIn(refresh_response.status_code, {status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED})
