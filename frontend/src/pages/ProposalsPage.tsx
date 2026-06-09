import React, { useMemo, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useSearchParams } from 'react-router-dom';

import ProposalGenerator from '../components/ai/ProposalGenerator';
import ProposalDetailDialog from '../components/ai/proposals/ProposalDetailDialog';
import ProposalEditDialog from '../components/ai/proposals/ProposalEditDialog';
import ProposalFilters from '../components/ai/proposals/ProposalFilters';
import ProposalList from '../components/ai/proposals/ProposalList';
import SendProposalDialog from '../components/ai/proposals/SendProposalDialog';
import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import {
  useApproveProposalMutation,
  useArchiveProposalMutation,
  useDeleteProposalMutation,
  useDownloadProposalPdfMutation,
  useGenerateProposalMutation,
  useProposals,
  useSendProposalMutation,
  useUpdateProposalMutation,
} from '../hooks/useAI';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { AIProposalFilters, GenerateProposalPayload, ProposalDraft, ProposalSendPayload } from '../types/ai';
import { extractCursor } from '../utils/pagination';

const proposalFilterDefaults = {
  search: '',
  status: '',
  proposal_type: '',
  lead_id: '',
  client_id: '',
  project_id: '',
  cursor: '',
};

const numericParam = (value?: string) => {
  const parsed = Number(value);
  return value && !Number.isNaN(parsed) ? parsed : undefined;
};

const ProposalsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlFilters, setUrlFilters] = useUrlFilters(proposalFilterDefaults);
  const [cursor, setCursor] = useState<string | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(searchParams.get('generate') === '1');
  const [viewingProposal, setViewingProposal] = useState<ProposalDraft | null>(null);
  const [editingProposal, setEditingProposal] = useState<ProposalDraft | null>(null);
  const [sendingProposal, setSendingProposal] = useState<ProposalDraft | null>(null);

  const filters = useMemo<AIProposalFilters>(
    () => ({ ...urlFilters, cursor: cursor ?? undefined }),
    [urlFilters, cursor]
  );

  const proposalsQuery = useProposals(filters);
  const generateMutation = useGenerateProposalMutation();
  const approveMutation = useApproveProposalMutation();
  const archiveMutation = useArchiveProposalMutation();
  const deleteMutation = useDeleteProposalMutation();
  const updateMutation = useUpdateProposalMutation();
  const downloadMutation = useDownloadProposalPdfMutation();
  const sendMutation = useSendProposalMutation();

  const proposals = proposalsQuery.data?.results ?? [];
  const nextCursor = extractCursor(proposalsQuery.data?.next);
  const initialLeadId = numericParam(urlFilters.lead_id);
  const initialClientId = numericParam(urlFilters.client_id);
  const initialProjectId = numericParam(urlFilters.project_id);

  const openGenerator = () => {
    setGeneratorOpen(true);
    const next = new URLSearchParams(searchParams);
    next.set('generate', '1');
    setSearchParams(next, { replace: true });
  };

  const closeGenerator = () => {
    setGeneratorOpen(false);
    const next = new URLSearchParams(searchParams);
    next.delete('generate');
    setSearchParams(next, { replace: true });
  };

  const handleFilterChange = (updates: Partial<AIProposalFilters>) => {
    setCursor(null);
    setUrlFilters(updates as Partial<typeof proposalFilterDefaults>);
  };

  const handleGenerate = async (payload: GenerateProposalPayload) => {
    const draft = await generateMutation.mutateAsync(payload);
    setViewingProposal(draft);
    return draft;
  };

  const handleUpdate = async (payload: Pick<ProposalDraft, 'title' | 'generated_content' | 'status'>) => {
    if (!editingProposal) return;
    const updated = await updateMutation.mutateAsync({ id: editingProposal.id, payload });
    setEditingProposal(null);
    setViewingProposal(updated);
  };

  const handleApprove = async (proposal: ProposalDraft) => {
    const updated = await approveMutation.mutateAsync(proposal.id);
    setViewingProposal(updated);
  };

  const handleArchive = async (proposal: ProposalDraft) => {
    const updated = await archiveMutation.mutateAsync(proposal.id);
    setViewingProposal(updated);
  };

  const handleDelete = async (proposal: ProposalDraft) => {
    await deleteMutation.mutateAsync(proposal.id);
    if (viewingProposal?.id === proposal.id) setViewingProposal(null);
    if (editingProposal?.id === proposal.id) setEditingProposal(null);
    if (sendingProposal?.id === proposal.id) setSendingProposal(null);
  };

  const handleSend = async (payload: ProposalSendPayload) => {
    if (!sendingProposal) return;
    const updated = await sendMutation.mutateAsync({ id: sendingProposal.id, payload });
    setSendingProposal(null);
    setViewingProposal(updated);
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Proposals"
        description="View, manage, and reuse AI-generated proposal drafts."
        actions={
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={generatorOpen ? closeGenerator : openGenerator}>
            {generatorOpen ? 'Hide Generator' : 'Generate New Proposal'}
          </Button>
        }
      />

      {generatorOpen ? (
        <ProposalGenerator
          initialLeadId={initialLeadId}
          initialClientId={initialClientId}
          initialProjectId={initialProjectId}
          onGenerate={handleGenerate}
          onApprove={(id) => approveMutation.mutateAsync(id)}
          onArchive={(id) => archiveMutation.mutateAsync(id)}
          isGenerating={generateMutation.isLoading}
          approveLoading={approveMutation.isLoading}
          archiveLoading={archiveMutation.isLoading}
          error={generateMutation.error}
          actionError={approveMutation.error || archiveMutation.error}
        />
      ) : null}

      {deleteMutation.isError ? <Alert severity="error">Unable to delete proposal.</Alert> : null}

      <ProposalFilters filters={urlFilters} onChange={handleFilterChange} />

      <AppCard title="Saved Proposals" subtitle="All proposal drafts generated from ClientFlow data.">
        <ProposalList
          proposals={proposals}
          isLoading={proposalsQuery.isLoading && !proposalsQuery.data}
          isError={proposalsQuery.isError}
          error={proposalsQuery.error}
          onRetry={() => proposalsQuery.refetch()}
          onGenerate={openGenerator}
          approveLoading={approveMutation.isLoading}
          archiveLoading={archiveMutation.isLoading}
          deleteLoading={deleteMutation.isLoading}
          downloadLoading={downloadMutation.isLoading}
          sendLoading={sendMutation.isLoading}
          onView={setViewingProposal}
          onEdit={setEditingProposal}
          onDownload={(proposal) => downloadMutation.mutate(proposal.id)}
          onSend={setSendingProposal}
          onApprove={(proposal) => approveMutation.mutate(proposal.id)}
          onArchive={(proposal) => archiveMutation.mutate(proposal.id)}
          onDelete={(proposal) => handleDelete(proposal)}
        />
      </AppCard>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="outlined" disabled={!nextCursor || proposalsQuery.isFetching} onClick={() => setCursor(nextCursor)}>
          Load more
        </Button>
      </Stack>

      <ProposalDetailDialog
        open={Boolean(viewingProposal)}
        proposal={viewingProposal}
        approveLoading={approveMutation.isLoading}
        archiveLoading={archiveMutation.isLoading}
        deleteLoading={deleteMutation.isLoading}
        downloadLoading={downloadMutation.isLoading}
        sendLoading={sendMutation.isLoading}
        onClose={() => setViewingProposal(null)}
        onEdit={(proposal) => {
          setViewingProposal(null);
          setEditingProposal(proposal);
        }}
        onDownload={(proposal) => downloadMutation.mutate(proposal.id)}
        onSend={setSendingProposal}
        onApprove={handleApprove}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />

      <ProposalEditDialog
        open={Boolean(editingProposal)}
        proposal={editingProposal}
        loading={updateMutation.isLoading}
        error={updateMutation.error}
        onClose={() => setEditingProposal(null)}
        onSubmit={handleUpdate}
      />
      <SendProposalDialog
        open={Boolean(sendingProposal)}
        proposal={sendingProposal}
        loading={sendMutation.isLoading}
        error={sendMutation.error}
        onClose={() => setSendingProposal(null)}
        onSubmit={handleSend}
      />
    </Stack>
  );
};

export default ProposalsPage;
