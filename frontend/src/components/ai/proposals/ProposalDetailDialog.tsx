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
  downloadLoading?: boolean;
  sendLoading?: boolean;
  onClose: () => void;
  onEdit: (proposal: ProposalDraft) => void;
  onDownload: (proposal: ProposalDraft) => void;
  onSend: (proposal: ProposalDraft) => void;
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
  downloadLoading,
  sendLoading,
  onClose,
  onEdit,
  onDownload,
  onSend,
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
            <Stack spacing={0.5}>
              <Typography color="text.secondary">Sent to: {proposal.sent_to_email || 'Not sent'}</Typography>
              <Typography color="text.secondary">Sent date: {proposal.sent_at ? new Date(proposal.sent_at).toLocaleString() : 'Not sent'}</Typography>
              <Typography color="text.secondary">Downloads: {proposal.download_count ?? 0}</Typography>
              <Typography color="text.secondary">
                Last downloaded: {proposal.last_downloaded_at ? new Date(proposal.last_downloaded_at).toLocaleString() : 'Never'}
              </Typography>
            </Stack>
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
        <Button onClick={() => proposal && onDownload(proposal)} disabled={!proposal || downloadLoading}>
          {downloadLoading ? 'Downloading...' : 'Download PDF'}
        </Button>
        <Button onClick={() => proposal && onSend(proposal)} disabled={!proposal || sendLoading || proposal?.status === 'archived'}>
          {sendLoading ? 'Sending...' : 'Send to Client'}
        </Button>
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
