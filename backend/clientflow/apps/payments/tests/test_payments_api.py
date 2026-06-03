from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.clients.models import Client
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.projects.models import Project
from clientflow.apps.users.models import User


class PaymentAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='billing@example.com',
            password=self.password,
            first_name='Billing',
            last_name='Owner',
            organization_name='ClientFlow',
        )
        self.client_record = Client.objects.create(
            name='Acme Client',
            email='client@acme.com',
            phone='+1-555-0000',
            company='Acme Inc',
            status='active',
            owner=self.user,
            organization_name='ClientFlow',
        )
        self.project = Project.objects.create(
            name='Website Redesign',
            description='Billing project',
            client=self.client_record,
            owner=self.user,
            status='active',
        )
        self.invoice = Invoice.objects.create(
            client=self.client_record,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            due_date='2026-06-15',
            issue_date='2026-06-01',
            tax='10.00',
            notes='billing',
        )
        self.invoice.items.create(description='Work', quantity='1', unit_price='110.00')
        login = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def test_create_verify_and_invoice_payments(self):
        response = self.client.post(
            reverse('payments:payment-list'),
            {
                'invoice_id': self.invoice.id,
                'amount': '120.00',
                'payment_method': 'stripe_mock',
                'status': 'pending',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payment_id = response.data['id']

        verify_response = self.client.post(
            reverse('payments:payment-verify', args=[payment_id]),
            {'transaction_id': 'txn-123'},
            format='json',
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_response.data['status'], 'completed')
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'paid')

        invoice_payments = self.client.get(reverse('invoices:invoice-payments', args=[self.invoice.id]))
        self.assertEqual(invoice_payments.status_code, status.HTTP_200_OK)
        self.assertEqual(len(invoice_payments.data), 1)

    def test_prevent_double_payment(self):
        self.client.post(
            reverse('payments:payment-list'),
            {
                'invoice_id': self.invoice.id,
                'amount': '120.00',
                'payment_method': 'stripe_mock',
                'status': 'completed',
            },
            format='json',
        )
        second = self.client.post(
            reverse('payments:payment-list'),
            {
                'invoice_id': self.invoice.id,
                'amount': '10.00',
                'payment_method': 'card',
                'status': 'completed',
            },
            format='json',
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

