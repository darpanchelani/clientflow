import React from 'react';
import { Alert, Button, Skeleton, Stack } from '@mui/material';

import { ProposalDraft } from '../../../types/ai';
import { getFriendlyErrorMessage } from '../../../utils/apiError';
import ProposalCard from './ProposalCard';
import ProposalEmptyState from './ProposalEmptyState';

interface ProposalListProps {
  proposals: ProposalDraft[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  compact?: boolean;
  approveLoading?: boolean;
  archiveLoading?: boolean;
  deleteLoading?: boolean;
  onRetry?: () => void;
  onGenerate?: () => void;
  onView: (proposal: ProposalDraft) => void;
  onEdit: (proposal: ProposalDraft) => void;
  onApprove: (proposal: ProposalDraft) => void;
  onArchive: (proposal: ProposalDraft) => void;
  onDelete: (proposal: ProposalDraft) => void;
}

const ProposalList = ({
  proposals,
  isLoading,
  isError,
  error,
  compact,
  approveLoading,
  archiveLoading,
  deleteLoading,
  onRetry,
  onGenerate,
  onView,
  onEdit,
  onApprove,
  onArchive,
  onDelete,
}: ProposalListProps) => {
  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="rounded" height={compact ? 112 : 168} />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Retry</Button> : undefined}>
        {getFriendlyErrorMessage(error, 'Unable to load proposals.')}
      </Alert>
    );
  }

  if (proposals.length === 0) {
    return <ProposalEmptyState onGenerate={onGenerate} />;
  }

  return (
    <Stack spacing={2}>
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          compact={compact}
          approveLoading={approveLoading}
          archiveLoading={archiveLoading}
          deleteLoading={deleteLoading}
          onView={onView}
          onEdit={onEdit}
          onApprove={onApprove}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  );
};

export default ProposalList;
