from decimal import Decimal

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from clientflow.apps.ai_engine.models import ProposalDraft
from clientflow.apps.clients.models import Client
from clientflow.apps.leads.models import Lead
from clientflow.apps.projects.models import Project
from clientflow.apps.users.models import User


class AIProposalGeneratorAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='proposal@example.com',
            password='StrongPass123!',
            organization_name='ClientFlow',
        )
        self.other_user = User.objects.create_user(
            email='other-proposal@example.com',
            password='StrongPass123!',
            organization_name='OtherOrg',
        )
        self.lead = Lead.objects.create(
            name='Jordan Lee',
            email='jordan@example.com',
            company='Acme Labs',
            source=Lead.Source.REFERRAL,
            status=Lead.Status.QUALIFIED,
            score=78,
            owner=self.user,
            organization_name='ClientFlow',
        )
        self.client_obj = Client.objects.create(
            name='Acme Labs',
            email='hello@acme.test',
            company='Acme Labs',
            owner=self.user,
            organization_name='ClientFlow',
        )
        self.project = Project.objects.create(
            name='Workflow Redesign',
            description='Improve intake, delivery tracking, and billing handoff.',
            client=self.client_obj,
            owner=self.user,
            status=Project.Status.ACTIVE,
        )
        self.other_lead = Lead.objects.create(
            name='Blocked Lead',
            company='Other Company',
            owner=self.other_user,
            organization_name='OtherOrg',
        )
        self.other_client = Client.objects.create(
            name='Blocked Client',
            company='Other Company',
            owner=self.other_user,
            organization_name='OtherOrg',
        )
        self.other_project = Project.objects.create(
            name='Blocked Project',
            client=self.other_client,
            owner=self.other_user,
            status=Project.Status.ACTIVE,
        )
        self.payload = {
            'lead_id': self.lead.pk,
            'client_id': self.client_obj.pk,
            'project_id': self.project.pk,
            'title': 'Workflow Automation Proposal',
            'proposal_type': ProposalDraft.ProposalType.PROJECT,
            'estimated_budget': '12500.00',
            'estimated_timeline': '6 weeks',
            'services_offered': 'Discovery, workflow implementation, team training',
            'client_problem': 'Manual intake and delivery tracking are slowing operations.',
            'proposed_solution': 'Implement a structured workflow with clear project and billing checkpoints.',
            'tone': 'professional',
        }

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_authenticated_user_can_generate_template_proposal(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['source'], 'template')
        self.assertEqual(response.data['status'], ProposalDraft.Status.DRAFT)
        self.assertIn('Workflow Automation Proposal', response.data['generated_content'])

    def test_unauthenticated_user_cannot_generate_proposal(self):
        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_generated_proposal_is_saved_as_draft(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        draft = ProposalDraft.objects.get(pk=response.data['id'])
        self.assertEqual(draft.user, self.user)
        self.assertEqual(draft.proposal_type, ProposalDraft.ProposalType.PROJECT)
        self.assertEqual(draft.estimated_budget, Decimal('12500.00'))

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_proposal_includes_required_sections(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        content = response.data['generated_content']
        for section in [
            'Client Introduction',
            'Problem Understanding',
            'Proposed Solution',
            'Scope of Work',
            'Deliverables',
            'Timeline',
            'Investment / Pricing',
            'Payment Terms',
            'Why Choose Us',
            'Next Steps',
            'Closing Note',
        ]:
            self.assertIn(section, content)

    def test_negative_budget_validation_fails(self):
        self.client.force_authenticate(user=self.user)
        payload = {**self.payload, 'estimated_budget': '-1.00'}

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('estimated_budget', response.data['fields'])

    def test_user_cannot_access_another_users_proposal(self):
        draft = ProposalDraft.objects.create(
            user=self.other_user,
            title='Private Proposal',
            generated_content='Private content',
            services_offered='Private services',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:proposal-detail', args=[draft.pk]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_proposal_list_only_returns_current_users_proposals(self):
        ProposalDraft.objects.create(
            user=self.user,
            title='Visible Proposal',
            generated_content='Visible content',
            services_offered='Visible services',
        )
        ProposalDraft.objects.create(
            user=self.other_user,
            title='Hidden Proposal',
            generated_content='Hidden content',
            services_offered='Hidden services',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('ai:proposal-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in response.data['results']]
        self.assertEqual(titles, ['Visible Proposal'])

    def test_proposal_approve_endpoint_changes_status(self):
        draft = ProposalDraft.objects.create(
            user=self.user,
            title='Approval Proposal',
            generated_content='Approval content',
            services_offered='Approval services',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-approve', args=[draft.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        draft.refresh_from_db()
        self.assertEqual(draft.status, ProposalDraft.Status.APPROVED)

    def test_proposal_archive_endpoint_changes_status(self):
        draft = ProposalDraft.objects.create(
            user=self.user,
            title='Archive Proposal',
            generated_content='Archive content',
            services_offered='Archive services',
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-archive', args=[draft.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        draft.refresh_from_db()
        self.assertEqual(draft.status, ProposalDraft.Status.ARCHIVED)

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='openai')
    def test_openai_missing_key_does_not_crash_generation(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['source'], 'template')

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_lead_client_project_context_is_included(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(reverse('ai:proposal-generate'), self.payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Acme Labs', response.data['generated_content'])
        self.assertIn('Workflow Redesign', response.data['generated_content'])

    def test_user_cannot_generate_from_inaccessible_lead(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            **self.payload,
            'lead_id': self.other_lead.pk,
            'client_id': None,
            'project_id': None,
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lead_id', response.data['fields'])

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_generate_without_relations_with_client_problem(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'title': 'Standalone Proposal',
            'proposal_type': ProposalDraft.ProposalType.CUSTOM,
            'services_offered': 'Workflow review and implementation plan',
            'client_problem': 'The client needs clearer delivery workflows.',
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['lead'])
        self.assertIsNone(response.data['client'])
        self.assertIsNone(response.data['project'])

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_generate_with_valid_lead_id(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'lead_id': self.lead.pk,
            'title': 'Lead Proposal',
            'proposal_type': ProposalDraft.ProposalType.SERVICE,
            'services_offered': 'Discovery and implementation',
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['lead'], self.lead.pk)
        self.assertEqual(response.data['lead_summary']['name'], self.lead.name)

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_generate_with_valid_client_id(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'client_id': self.client_obj.pk,
            'title': 'Client Proposal',
            'proposal_type': ProposalDraft.ProposalType.RETAINER,
            'services_offered': 'Monthly workflow optimization',
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['client'], self.client_obj.pk)
        self.assertEqual(response.data['client_summary']['name'], self.client_obj.name)

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_generate_with_valid_project_id(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'project_id': self.project.pk,
            'title': 'Project Proposal',
            'proposal_type': ProposalDraft.ProposalType.PROJECT,
            'services_offered': 'Project delivery acceleration',
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project'], self.project.pk)
        self.assertEqual(response.data['client'], self.client_obj.pk)
        self.assertEqual(response.data['project_summary']['name'], self.project.name)

    def test_invalid_relation_ids_return_friendly_errors(self):
        self.client.force_authenticate(user=self.user)
        base_payload = {
            'title': 'Invalid Relation Proposal',
            'proposal_type': ProposalDraft.ProposalType.CUSTOM,
            'services_offered': 'Workflow support',
        }

        lead_response = self.client.post(reverse('ai:proposal-generate'), {**base_payload, 'lead_id': 999999}, format='json')
        client_response = self.client.post(reverse('ai:proposal-generate'), {**base_payload, 'client_id': 999999}, format='json')
        project_response = self.client.post(reverse('ai:proposal-generate'), {**base_payload, 'project_id': 999999}, format='json')

        self.assertEqual(lead_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(client_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(project_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Selected lead was not found.', str(lead_response.data['fields']['lead_id']))
        self.assertIn('Selected client was not found.', str(client_response.data['fields']['client_id']))
        self.assertIn('Selected project was not found.', str(project_response.data['fields']['project_id']))

    @override_settings(OPENAI_API_KEY='', AI_PROPOSAL_PROVIDER='template')
    def test_empty_string_relation_ids_do_not_crash(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'lead_id': '',
            'client_id': '',
            'project_id': '',
            'title': 'Empty Relations Proposal',
            'proposal_type': ProposalDraft.ProposalType.CUSTOM,
            'services_offered': 'Workflow support',
            'client_problem': 'Manual operations need structure.',
        }

        response = self.client.post(reverse('ai:proposal-generate'), payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['lead'])
        self.assertIsNone(response.data['client'])
        self.assertIsNone(response.data['project'])

    def test_user_cannot_generate_from_inaccessible_client_or_project(self):
        self.client.force_authenticate(user=self.user)
        base_payload = {
            'title': 'Blocked Proposal',
            'proposal_type': ProposalDraft.ProposalType.CUSTOM,
            'services_offered': 'Workflow support',
        }

        client_response = self.client.post(
            reverse('ai:proposal-generate'),
            {**base_payload, 'client_id': self.other_client.pk},
            format='json',
        )
        project_response = self.client.post(
            reverse('ai:proposal-generate'),
            {**base_payload, 'project_id': self.other_project.pk},
            format='json',
        )

        self.assertEqual(client_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(project_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('client_id', client_response.data['fields'])
        self.assertIn('project_id', project_response.data['fields'])
