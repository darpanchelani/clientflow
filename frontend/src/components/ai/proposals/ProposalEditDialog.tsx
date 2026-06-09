import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import { ProposalDraft } from '../../../types/ai';
import { getFriendlyErrorMessage } from '../../../utils/apiError';

interface ProposalEditDialogProps {
  open: boolean;
  proposal: ProposalDraft | null;
  loading?: boolean;
  error?: unknown;
  onClose: () => void;
  onSubmit: (payload: Pick<ProposalDraft, 'title' | 'generated_content' | 'status'>) => Promise<void>;
}

const ProposalEditDialog = ({
  open,
  proposal,
  loading,
  error,
  onClose,
  onSubmit,
}: ProposalEditDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ProposalDraft['status']>('draft');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open || !proposal) return;
    setTitle(proposal.title);
    setContent(proposal.generated_content);
    setStatus(proposal.status);
    setValidationError('');
  }, [open, proposal]);

  const handleSubmit = async () => {
    setValidationError('');
    if (!title.trim()) {
      setValidationError('Title is required.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Proposal content is required.');
      return;
    }
    await onSubmit({ title: title.trim(), generated_content: content.trim(), status });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Proposal</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
          {error ? <Alert severity="error">{getFriendlyErrorMessage(error)}</Alert> : null}
          <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth required />
          <TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value as ProposalDraft['status'])} fullWidth>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
          <TextField
            label="Proposal content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            fullWidth
            required
            multiline
            minRows={14}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProposalEditDialog;
