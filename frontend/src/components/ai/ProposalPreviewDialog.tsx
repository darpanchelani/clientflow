import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { ProposalDraft } from '../../types/ai';
import { getFriendlyErrorMessage } from '../../utils/apiError';

interface ProposalPreviewDialogProps {
  open: boolean;
  proposal: ProposalDraft | null;
  onClose: () => void;
  onApprove: (id: number) => void | Promise<void>;
  onArchive: (id: number) => void | Promise<void>;
  approveLoading?: boolean;
  archiveLoading?: boolean;
  error?: unknown;
}

const ProposalPreviewDialog = ({
  open,
  proposal,
  onClose,
  onApprove,
  onArchive,
  approveLoading,
  archiveLoading,
  error,
}: ProposalPreviewDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!proposal?.generated_content) return;
    await navigator.clipboard.writeText(proposal.generated_content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{proposal?.title || 'Generated proposal'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{getFriendlyErrorMessage(error)}</Alert> : null}
          {copied ? <Alert severity="success">Proposal copied to clipboard.</Alert> : null}
          {proposal?.generated_content ? (
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                m: 0,
                color: 'text.primary',
                lineHeight: 1.7,
              }}
            >
              {proposal.generated_content}
            </Typography>
          ) : (
            <Typography color="text.secondary">No proposal content available.</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopy} startIcon={<ContentCopyIcon />} disabled={!proposal?.generated_content}>
          Copy
        </Button>
        <Button onClick={() => proposal && onArchive(proposal.id)} disabled={!proposal || archiveLoading || approveLoading}>
          {archiveLoading ? 'Archiving...' : 'Archive'}
        </Button>
        <Button variant="contained" onClick={() => proposal && onApprove(proposal.id)} disabled={!proposal || approveLoading || archiveLoading}>
          {approveLoading ? 'Approving...' : 'Approve'}
        </Button>
        <Button onClick={onClose} disabled={approveLoading || archiveLoading}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposalPreviewDialog;
