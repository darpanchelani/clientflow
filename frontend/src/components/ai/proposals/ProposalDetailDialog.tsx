import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { ProposalDraft } from '../../../types/ai';
import ProposalStatusChip from './ProposalStatusChip';

interface ProposalDetailDialogProps {
  open: boolean;
  proposal: ProposalDraft | null;
  approveLoading?: boolean;
  archiveLoading?: boolean;
  deleteLoading?: boolean;
  onClose: () => void;
  onEdit: (proposal: ProposalDraft) => void;
  onApprove: (proposal: ProposalDraft) => void;
  onArchive: (proposal: ProposalDraft) => void;
  onDelete: (proposal: ProposalDraft) => void;
}

const relationLine = (proposal: ProposalDraft) =>
  [
    proposal.client_summary?.name ? `Client: ${proposal.client_summary.name}` : '',
    proposal.project_summary?.name ? `Project: ${proposal.project_summary.name}` : '',
    proposal.lead_summary?.name ? `Lead: ${proposal.lead_summary.name}` : '',
  ].filter(Boolean).join(' | ') || 'No linked lead, client, or project';

const ProposalDetailDialog = ({
  open,
  proposal,
  approveLoading,
  archiveLoading,
  deleteLoading,
  onClose,
  onEdit,
  onApprove,
  onArchive,
  onDelete,
}: ProposalDetailDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal.generated_content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = () => {
    if (proposal && window.confirm('Delete this proposal? This cannot be undone.')) {
      onDelete(proposal);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{proposal?.title ?? 'Proposal'}</DialogTitle>
      <DialogContent dividers>
        {proposal ? (
          <Stack spacing={2}>
            {copied ? <Alert severity="success">Proposal copied to clipboard.</Alert> : null}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <ProposalStatusChip status={proposal.status} />
              <Typography color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {proposal.proposal_type}
              </Typography>
              <Typography color="text.secondary">Created {new Date(proposal.created_at).toLocaleString()}</Typography>
              <Typography color="text.secondary">Updated {new Date(proposal.updated_at).toLocaleString()}</Typography>
            </Stack>
            <Typography color="text.secondary">{relationLine(proposal)}</Typography>
            <Divider />
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                lineHeight: 1.7,
                m: 0,
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {proposal.generated_content}
            </Typography>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} startIcon={<ContentCopyIcon />} disabled={!proposal}>Copy</Button>
        <Button onClick={() => proposal && onEdit(proposal)} disabled={!proposal}>Edit</Button>
        {proposal?.status !== 'approved' ? (
          <Button onClick={() => proposal && onApprove(proposal)} disabled={!proposal || approveLoading}>
            {approveLoading ? 'Approving...' : 'Approve'}
          </Button>
        ) : null}
        {proposal?.status !== 'archived' ? (
          <Button onClick={() => proposal && onArchive(proposal)} disabled={!proposal || archiveLoading}>
            {archiveLoading ? 'Archiving...' : 'Archive'}
          </Button>
        ) : null}
        <Button color="error" onClick={handleDelete} disabled={!proposal || deleteLoading}>Delete</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposalDetailDialog;
