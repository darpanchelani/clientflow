import React, { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import AppCard from '../../common/AppCard';
import {
  useApproveProposalMutation,
  useArchiveProposalMutation,
  useDeleteProposalMutation,
  useDownloadProposalPdfMutation,
  useProposals,
  useSendProposalMutation,
  useUpdateProposalMutation,
} from '../../../hooks/useAI';
import { ProposalDraft, ProposalSendPayload } from '../../../types/ai';
import ProposalDetailDialog from './ProposalDetailDialog';
import ProposalEditDialog from './ProposalEditDialog';
import ProposalList from './ProposalList';
import SendProposalDialog from './SendProposalDialog';

interface RelatedProposalsPanelProps {
  leadId?: number;
  clientId?: number;
  projectId?: number;
  title?: string;
  compact?: boolean;
}

const RelatedProposalsPanel = ({
  leadId,
  clientId,
  projectId,
  title = 'Related Proposals',
  compact = true,
}: RelatedProposalsPanelProps) => {
  const navigate = useNavigate();
  const filters = {
    lead_id: leadId ? String(leadId) : '',
    client_id: clientId ? String(clientId) : '',
    project_id: projectId ? String(projectId) : '',
  };
  const proposalsQuery = useProposals(filters);
  const approveMutation = useApproveProposalMutation();
  const archiveMutation = useArchiveProposalMutation();
  const deleteMutation = useDeleteProposalMutation();
  const updateMutation = useUpdateProposalMutation();
  const downloadMutation = useDownloadProposalPdfMutation();
  const sendMutation = useSendProposalMutation();
  const [viewingProposal, setViewingProposal] = useState<ProposalDraft | null>(null);
  const [editingProposal, setEditingProposal] = useState<ProposalDraft | null>(null);
  const [sendingProposal, setSendingProposal] = useState<ProposalDraft | null>(null);

  const proposals = proposalsQuery.data?.results ?? [];
  const generateParams = new URLSearchParams({ generate: '1' });
  if (leadId) generateParams.set('lead_id', String(leadId));
  if (clientId) generateParams.set('client_id', String(clientId));
  if (projectId) generateParams.set('project_id', String(projectId));

  const handleUpdate = async (payload: Pick<ProposalDraft, 'title' | 'generated_content' | 'status'>) => {
    if (!editingProposal) return;
    await updateMutation.mutateAsync({ id: editingProposal.id, payload });
    setEditingProposal(null);
  };

  const handleSend = async (payload: ProposalSendPayload) => {
    if (!sendingProposal) return;
    const updated = await sendMutation.mutateAsync({ id: sendingProposal.id, payload });
    setSendingProposal(null);
    setViewingProposal(updated);
  };

  return (
    <AppCard
      title={title}
      subtitle="Saved proposal drafts linked to this record."
      action={
        <Button size="small" variant="outlined" onClick={() => navigate(`/proposals?${generateParams.toString()}`)}>
          Generate Proposal
        </Button>
      }
    >
      <Stack spacing={2}>
        <ProposalList
          compact={compact}
          proposals={proposals}
          isLoading={proposalsQuery.isLoading && !proposalsQuery.data}
          isError={proposalsQuery.isError}
          error={proposalsQuery.error}
          onRetry={() => proposalsQuery.refetch()}
          onGenerate={() => navigate(`/proposals?${generateParams.toString()}`)}
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
          onDelete={(proposal) => deleteMutation.mutate(proposal.id)}
        />
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
        onApprove={(proposal) => approveMutation.mutate(proposal.id)}
        onArchive={(proposal) => archiveMutation.mutate(proposal.id)}
        onDelete={(proposal) => {
          deleteMutation.mutate(proposal.id);
          setViewingProposal(null);
        }}
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
    </AppCard>
  );
};

export default RelatedProposalsPanel;
