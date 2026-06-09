from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import ProposalDraft
from clientflow.apps.users.models import User


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ProposalExportAPITests(APITestCase):
    def setUp(self):
        self.password = 'StrongPass123!'
        self.user = User.objects.create_user(
            email='proposal-export@example.com',
            password=self.password,
            first_name='Proposal',
            last_name='Owner',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other-proposal-export@example.com',
            password=self.password,
            first_name='Other',
            last_name='Owner',
            organization_name='OtherOrg',
        )
        self.proposal = ProposalDraft.objects.create(
            user=self.user,
            title='Website Development Proposal',
            generated_content='Proposal intro\n\nScope of work\nPricing',
            proposal_type=ProposalDraft.ProposalType.PROJECT,
        )
        self.other_proposal = ProposalDraft.objects.create(
            user=self.other_user,
            title='Private Proposal',
            generated_content='Private content',
        )
        login = self.client.post(reverse('auth:login'), {'email': self.user.email, 'password': self.password}, format='json')
        self.token = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_authenticated_user_can_download_own_proposal_pdf(self):
        response = self.client.get(reverse('ai:proposal-download', args=[self.proposal.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('proposal-', response['Content-Disposition'])
        self.assertTrue(response.content.startswith(b'%PDF'))

    def test_unauthenticated_user_cannot_download_proposal(self):
        self.client.credentials()
        response = self.client.get(reverse('ai:proposal-download', args=[self.proposal.pk]))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_download_another_users_proposal(self):
        response = self.client.get(reverse('ai:proposal-download', args=[self.other_proposal.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_download_updates_metadata(self):
        response = self.client.get(reverse('ai:proposal-download', args=[self.proposal.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.download_count, 1)
        self.assertIsNotNone(self.proposal.last_downloaded_at)

    def test_authenticated_user_can_send_own_proposal(self):
        response = self.client.post(
            reverse('ai:proposal-send', args=[self.proposal.pk]),
            {
                'to_email': 'client@example.com',
                'subject': 'Proposal: Website Development',
                'message': 'Please review the attached proposal.',
                'attach_pdf': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['client@example.com'])
        self.assertEqual(len(mail.outbox[0].attachments), 1)

    def test_sending_updates_status_sent_at_and_email(self):
        response = self.client.post(
            reverse('ai:proposal-send', args=[self.proposal.pk]),
            {
                'to_email': 'client@example.com',
                'subject': 'Proposal: Website Development',
                'message': '',
                'attach_pdf': False,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.proposal.refresh_from_db()
        self.assertEqual(self.proposal.status, ProposalDraft.Status.SENT)
        self.assertEqual(self.proposal.sent_to_email, 'client@example.com')
        self.assertIsNotNone(self.proposal.sent_at)

    def test_archived_proposal_cannot_be_sent(self):
        self.proposal.status = ProposalDraft.Status.ARCHIVED
        self.proposal.save(update_fields=['status'])

        response = self.client.post(
            reverse('ai:proposal-send', args=[self.proposal.pk]),
            {'to_email': 'client@example.com', 'subject': 'Proposal', 'attach_pdf': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_email_fails_validation(self):
        response = self.client.post(
            reverse('ai:proposal-send', args=[self.proposal.pk]),
            {'to_email': 'not-an-email', 'subject': 'Proposal', 'attach_pdf': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('to_email', response.data['fields'])

    def test_missing_subject_fails_validation(self):
        response = self.client.post(
            reverse('ai:proposal-send', args=[self.proposal.pk]),
            {'to_email': 'client@example.com', 'attach_pdf': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('subject', response.data['fields'])

    def test_user_cannot_send_another_users_proposal(self):
        response = self.client.post(
            reverse('ai:proposal-send', args=[self.other_proposal.pk]),
            {'to_email': 'client@example.com', 'subject': 'Proposal', 'attach_pdf': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
