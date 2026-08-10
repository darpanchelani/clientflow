from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.clients.models import Client
from clientflow.apps.projects.models import Project
from clientflow.apps.users.models import User

from ..models import Invoice


class InvoiceAPITests(APITestCase):
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
        login = self.client.post(
            reverse('auth:login'),
            {'email': self.user.email, 'password': self.password},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    def _create_invoice(self, **overrides):
        payload = {
            'client_id': self.client_record.id,
            'project_id': self.project.id,
            'issue_date': '2026-06-01',
            'due_date': '2026-06-15',
            'tax': '15.00',
            'notes': 'Net 14',
            'items': [
                {'description': 'Discovery workshop', 'quantity': '1', 'unit_price': '100.00'},
                {'description': 'Implementation', 'quantity': '2', 'unit_price': '150.00'},
            ],
        }
        payload.update(overrides)
        return self.client.post(reverse('invoices:invoice-list'), payload, format='json')

    def test_create_list_send_update_and_overdue(self):
        response = self._create_invoice()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        invoice_id = response.data['id']
        self.assertTrue(response.data['invoice_number'].startswith('INV-'))
        self.assertEqual(str(response.data['subtotal']), '400.00')
        self.assertEqual(str(response.data['total']), '415.00')

        list_response = self.client.get(reverse('invoices:invoice-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 1)

        update_response = self.client.put(
            reverse('invoices:invoice-detail', args=[invoice_id]),
            {
                'client_id': self.client_record.id,
                'project_id': self.project.id,
                'issue_date': '2026-06-01',
                'due_date': '2026-06-20',
                'tax': '20.00',
                'notes': 'Updated notes',
                'status': 'draft',
                'items': [
                    {'description': 'Discovery workshop', 'quantity': '1', 'unit_price': '100.00'},
                    {'description': 'Implementation', 'quantity': '2', 'unit_price': '150.00'},
                    {'description': 'Support', 'quantity': '1', 'unit_price': '50.00'},
                ],
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(str(update_response.data['subtotal']), '450.00')

        send_response = self.client.post(reverse('invoices:invoice-send', args=[invoice_id]), {}, format='json')
        self.assertEqual(send_response.status_code, status.HTTP_200_OK)
        self.assertEqual(send_response.data['status'], 'sent')

    def test_overdue_invoice_updates_status_on_query(self):
        invoice = Invoice.objects.create(
            client=self.client_record,
            project=self.project,
            owner=self.user,
            organization_name='ClientFlow',
            status=Invoice.Status.SENT,
            due_date='2020-01-01',
            issue_date='2020-01-01',
            tax='0.00',
            notes='old invoice',
        )
        response = self.client.get(reverse('invoices:invoice-detail', args=[invoice.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, 'overdue')
