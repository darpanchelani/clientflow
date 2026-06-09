import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';

import { ProposalDraft, ProposalSendPayload } from '../../../types/ai';
import { getFriendlyErrorMessage } from '../../../utils/apiError';

interface SendProposalDialogProps {
  open: boolean;
  proposal: ProposalDraft | null;
  loading?: boolean;
  error?: unknown;
  onClose: () => void;
  onSubmit: (payload: ProposalSendPayload) => Promise<void>;
}

const defaultMessage = 'Hi,\n\nPlease find the proposal attached for your review.\n\nBest regards.';

const SendProposalDialog = ({ open, proposal, loading, error, onClose, onSubmit }: SendProposalDialogProps) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [attachPdf, setAttachPdf] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open || !proposal) return;
    setToEmail(proposal.client_summary?.email || proposal.lead_summary?.email || proposal.sent_to_email || '');
    setSubject(`Proposal: ${proposal.title}`);
    setMessage(defaultMessage);
    setAttachPdf(true);
    setValidationError('');
  }, [open, proposal]);

  const handleSubmit = async () => {
    setValidationError('');
    if (!toEmail.trim()) {
      setValidationError('To email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim())) {
      setValidationError('Enter a valid email address.');
      return;
    }
    if (!subject.trim()) {
      setValidationError('Subject is required.');
      return;
    }
    await onSubmit({
      to_email: toEmail.trim(),
      subject: subject.trim(),
      message,
      attach_pdf: attachPdf,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Proposal</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {proposal?.status === 'archived' ? (
            <Alert severity="warning">Archived proposals cannot be sent. Unarchive or duplicate it first.</Alert>
          ) : null}
          {validationError ? <Alert severity="warning">{validationError}</Alert> : null}
          {error ? <Alert severity="error">{getFriendlyErrorMessage(error)}</Alert> : null}
          <TextField label="To email" value={toEmail} onChange={(event) => setToEmail(event.target.value)} fullWidth required />
          <TextField label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} fullWidth required />
          <TextField label="Message" value={message} onChange={(event) => setMessage(event.target.value)} fullWidth multiline minRows={5} />
          <FormControlLabel
            control={<Checkbox checked={attachPdf} onChange={(event) => setAttachPdf(event.target.checked)} />}
            label="Attach PDF"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !proposal || proposal.status === 'archived'}>
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendProposalDialog;
