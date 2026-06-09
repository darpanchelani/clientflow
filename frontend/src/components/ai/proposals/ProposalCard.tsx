import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';

import { ProposalDraft } from '../../../types/ai';
import ProposalActions from './ProposalActions';
import ProposalStatusChip from './ProposalStatusChip';

interface ProposalCardProps {
  proposal: ProposalDraft;
  compact?: boolean;
  approveLoading?: boolean;
  archiveLoading?: boolean;
  deleteLoading?: boolean;
  downloadLoading?: boolean;
  sendLoading?: boolean;
  onView: (proposal: ProposalDraft) => void;
  onEdit: (proposal: ProposalDraft) => void;
  onDownload: (proposal: ProposalDraft) => void;
  onSend: (proposal: ProposalDraft) => void;
  onApprove: (proposal: ProposalDraft) => void;
  onArchive: (proposal: ProposalDraft) => void;
  onDelete: (proposal: ProposalDraft) => void;
}

const relationText = (proposal: ProposalDraft) =>
  [
    proposal.client_summary?.name ? `Client: ${proposal.client_summary.name}` : '',
    proposal.project_summary?.name ? `Project: ${proposal.project_summary.name}` : '',
    proposal.lead_summary?.name ? `Lead: ${proposal.lead_summary.name}` : '',
  ].filter(Boolean).join(' | ');

const ProposalCard = ({
  proposal,
  compact,
  approveLoading,
  archiveLoading,
  deleteLoading,
  downloadLoading,
  sendLoading,
  onView,
  onEdit,
  onDownload,
  onSend,
  onApprove,
  onArchive,
  onDelete,
}: ProposalCardProps) => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={0.75}>
            <Typography variant={compact ? 'subtitle1' : 'h6'} fontWeight={700}>
              {proposal.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <ProposalStatusChip status={proposal.status} />
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {proposal.proposal_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(proposal.created_at).toLocaleString()}
              </Typography>
            </Stack>
            {proposal.sent_to_email ? (
              <Typography variant="body2" color="text.secondary">
                Sent to {proposal.sent_to_email}{proposal.sent_at ? ` on ${new Date(proposal.sent_at).toLocaleString()}` : ''}
              </Typography>
            ) : null}
            {proposal.download_count ? (
              <Typography variant="body2" color="text.secondary">
                Downloaded {proposal.download_count} time{proposal.download_count === 1 ? '' : 's'}
              </Typography>
            ) : null}
          </Stack>
          <ProposalActions
            proposal={proposal}
            compact={compact}
            approveLoading={approveLoading}
            archiveLoading={archiveLoading}
            deleteLoading={deleteLoading}
            downloadLoading={downloadLoading}
            sendLoading={sendLoading}
            onView={onView}
            onEdit={onEdit}
            onDownload={onDownload}
            onSend={onSend}
            onApprove={onApprove}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </Stack>
        {relationText(proposal) ? (
          <Typography variant="body2" color="text.secondary">{relationText(proposal)}</Typography>
        ) : null}
        {!compact ? (
          <Typography color="text.secondary">
            {proposal.generated_content.slice(0, 220)}
            {proposal.generated_content.length > 220 ? '...' : ''}
          </Typography>
        ) : null}
      </Stack>
    </CardContent>
  </Card>
);

export default ProposalCard;
