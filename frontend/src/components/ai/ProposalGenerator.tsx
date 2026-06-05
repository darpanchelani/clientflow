import React, { FormEvent, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import AppCard from '../common/AppCard';
import { GenerateProposalPayload, ProposalDraft } from '../../types/ai';
import { Client, Lead } from '../../types/crm';
import { Project } from '../../types/projects';
import { useClientsQuery } from '../../hooks/useClients';
import { useLeadsQuery } from '../../hooks/useLeads';
import { useProjectsQuery } from '../../hooks/useProjects';
import { getFriendlyErrorMessage } from '../../utils/apiError';
import ProposalPreviewDialog from './ProposalPreviewDialog';

interface ProposalGeneratorProps {
  onGenerate: (payload: GenerateProposalPayload) => Promise<ProposalDraft>;
  onApprove: (id: number) => void;
  onArchive: (id: number) => void;
  isGenerating?: boolean;
  approveLoading?: boolean;
  archiveLoading?: boolean;
  error?: unknown;
  actionError?: unknown;
}

const initialForm: GenerateProposalPayload = {
  title: '',
  proposal_type: 'project',
  lead_id: null,
  client_id: null,
  project_id: null,
  estimated_budget: '',
  estimated_timeline: '',
  services_offered: '',
  client_problem: '',
  proposed_solution: '',
  tone: 'professional',
  include_payment_terms: true,
  include_timeline: true,
  include_deliverables: true,
};

const cleanProposalPayload = (
  form: GenerateProposalPayload,
  selectedLead: Lead | null,
  selectedClient: Client | null,
  selectedProject: Project | null
): GenerateProposalPayload => ({
  ...form,
  lead_id: selectedLead?.id ?? null,
  client_id: selectedClient?.id ?? null,
  project_id: selectedProject?.id ?? null,
  estimated_budget: form.estimated_budget || null,
});

const leadLabel = (lead: Lead) =>
  [lead.name, lead.email, lead.company].filter(Boolean).join(' · ');

const clientLabel = (client: Client) =>
  [client.name, client.company || client.email].filter(Boolean).join(' · ');

const projectLabel = (project: Project) =>
  [project.name, project.client?.name].filter(Boolean).join(' · ');

const ProposalGenerator = ({
  onGenerate,
  onApprove,
  onArchive,
  isGenerating,
  approveLoading,
  archiveLoading,
  error,
  actionError,
}: ProposalGeneratorProps) => {
  const [form, setForm] = useState<GenerateProposalPayload>(initialForm);
  const [clientError, setClientError] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [proposal, setProposal] = useState<ProposalDraft | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const leadsQuery = useLeadsQuery({});
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});

  const updateField = (field: keyof GenerateProposalPayload, value: string | boolean | number | null) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setClientError('');
    setSubmitError(null);
    if (!form.title.trim()) {
      setClientError('Title is required.');
      return;
    }
    if (!form.services_offered.trim()) {
      setClientError('Services offered is required.');
      return;
    }
    if (form.estimated_budget && Number(form.estimated_budget) < 0) {
      setClientError('Estimated budget cannot be negative.');
      return;
    }
    if (!selectedLead && !selectedClient && !selectedProject && !form.client_problem?.trim()) {
      setClientError('Client problem is required when no lead, client, or project is selected.');
      return;
    }

    const payload = cleanProposalPayload(form, selectedLead, selectedClient, selectedProject);
    try {
      const draft = await onGenerate(payload);
      setProposal(draft);
      setPreviewOpen(true);
    } catch (requestError) {
      setSubmitError(requestError);
    }
  };

  return (
    <AppCard
      title="Proposal generator"
      subtitle="Generate a client-ready proposal from lead, client, project, and scope details."
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        {clientError ? <Alert severity="warning">{clientError}</Alert> : null}
        {submitError || error ? <Alert severity="error">{getFriendlyErrorMessage(submitError || error)}</Alert> : null}
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              label="Proposal title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Proposal type"
              value={form.proposal_type}
              onChange={(event) => updateField('proposal_type', event.target.value)}
              fullWidth
              required
            >
              {['service', 'project', 'retainer', 'custom'].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={leadsQuery.data?.results ?? []}
              value={selectedLead}
              onChange={(_, value) => setSelectedLead(value)}
              getOptionLabel={leadLabel}
              loading={leadsQuery.isLoading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={leadsQuery.isError ? 'Unable to load leads' : 'No leads found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select lead"
                  helperText={leadsQuery.isError ? getFriendlyErrorMessage(leadsQuery.error, 'Unable to load leads.') : 'Optional'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={clientsQuery.data?.results ?? []}
              value={selectedClient}
              onChange={(_, value) => setSelectedClient(value)}
              getOptionLabel={clientLabel}
              loading={clientsQuery.isLoading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={clientsQuery.isError ? 'Unable to load clients' : 'No clients found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select client"
                  helperText={clientsQuery.isError ? getFriendlyErrorMessage(clientsQuery.error, 'Unable to load clients.') : 'Optional'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={projectsQuery.data?.results ?? []}
              value={selectedProject}
              onChange={(_, value) => {
                setSelectedProject(value);
                if (value?.client && !selectedClient) {
                  const matchingClient = clientsQuery.data?.results.find((client) => client.id === value.client.id);
                  if (matchingClient) setSelectedClient(matchingClient);
                }
              }}
              getOptionLabel={projectLabel}
              loading={projectsQuery.isLoading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={projectsQuery.isError ? 'Unable to load projects' : 'No projects found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select project"
                  helperText={projectsQuery.isError ? getFriendlyErrorMessage(projectsQuery.error, 'Unable to load projects.') : 'Optional'}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Estimated budget"
              type="number"
              value={form.estimated_budget ?? ''}
              onChange={(event) => updateField('estimated_budget', event.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Estimated timeline"
              value={form.estimated_timeline ?? ''}
              onChange={(event) => updateField('estimated_timeline', event.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Tone"
              value={form.tone}
              onChange={(event) => updateField('tone', event.target.value)}
              fullWidth
            >
              {['professional', 'friendly', 'persuasive', 'formal'].map((tone) => (
                <MenuItem key={tone} value={tone}>
                  {tone}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Services offered"
              value={form.services_offered}
              onChange={(event) => updateField('services_offered', event.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Client problem"
              value={form.client_problem ?? ''}
              onChange={(event) => updateField('client_problem', event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Proposed solution"
              value={form.proposed_solution ?? ''}
              onChange={(event) => updateField('proposed_solution', event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.include_payment_terms)} onChange={(event) => updateField('include_payment_terms', event.target.checked)} />}
            label="Payment terms"
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.include_timeline)} onChange={(event) => updateField('include_timeline', event.target.checked)} />}
            label="Timeline"
          />
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.include_deliverables)} onChange={(event) => updateField('include_deliverables', event.target.checked)} />}
            label="Deliverables"
          />
        </Stack>
        <Button
          type="submit"
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          disabled={isGenerating}
          sx={{ alignSelf: 'flex-start' }}
        >
          {isGenerating ? 'Generating proposal...' : 'Generate proposal'}
        </Button>
      </Stack>
      <ProposalPreviewDialog
        open={previewOpen}
        proposal={proposal}
        onClose={() => setPreviewOpen(false)}
        onApprove={onApprove}
        onArchive={onArchive}
        approveLoading={approveLoading}
        archiveLoading={archiveLoading}
        error={actionError}
      />
    </AppCard>
  );
};

export default ProposalGenerator;
