import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { ProposalDraft } from '../../../types/ai';

interface ProposalActionsProps {
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

const copyProposal = async (proposal: ProposalDraft) => {
  await navigator.clipboard.writeText(proposal.generated_content);
};

const ProposalActions = ({
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
}: ProposalActionsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyProposal(proposal);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this proposal? This cannot be undone.')) {
      onDelete(proposal);
    }
  };

  const menu = (
    <>
      <MenuItem onClick={() => { setAnchorEl(null); onView(proposal); }}>View</MenuItem>
      <MenuItem onClick={() => { setAnchorEl(null); onEdit(proposal); }}>Edit</MenuItem>
      <MenuItem onClick={() => { setAnchorEl(null); handleCopy(); }}>{copied ? 'Copied' : 'Copy'}</MenuItem>
      <MenuItem disabled={downloadLoading} onClick={() => { setAnchorEl(null); onDownload(proposal); }}>Download PDF</MenuItem>
      <MenuItem disabled={sendLoading || proposal.status === 'archived'} onClick={() => { setAnchorEl(null); onSend(proposal); }}>Send to Client</MenuItem>
      {proposal.status !== 'approved' ? (
        <MenuItem disabled={approveLoading} onClick={() => { setAnchorEl(null); onApprove(proposal); }}>Approve</MenuItem>
      ) : null}
      {proposal.status !== 'archived' ? (
        <MenuItem disabled={archiveLoading} onClick={() => { setAnchorEl(null); onArchive(proposal); }}>Archive</MenuItem>
      ) : null}
      <MenuItem disabled={deleteLoading} onClick={() => { setAnchorEl(null); handleDelete(); }}>Delete</MenuItem>
    </>
  );

  if (compact) {
    return (
      <>
        <IconButton aria-label={`Actions for ${proposal.title}`} onClick={(event) => setAnchorEl(event.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {menu}
        </Menu>
      </>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button size="small" onClick={() => onView(proposal)}>View</Button>
      <Button size="small" onClick={() => onEdit(proposal)}>Edit</Button>
      <Tooltip title={copied ? 'Copied' : 'Copy content'}>
        <IconButton size="small" aria-label={`Copy ${proposal.title}`} onClick={handleCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download PDF">
        <span>
          <IconButton size="small" aria-label={`Download ${proposal.title}`} disabled={downloadLoading} onClick={() => onDownload(proposal)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={proposal.status === 'archived' ? 'Archived proposals cannot be sent' : 'Send to client'}>
        <span>
          <IconButton size="small" aria-label={`Send ${proposal.title}`} disabled={sendLoading || proposal.status === 'archived'} onClick={() => onSend(proposal)}>
            <SendIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      {proposal.status !== 'approved' ? (
        <Button size="small" disabled={approveLoading} onClick={() => onApprove(proposal)}>Approve</Button>
      ) : null}
      {proposal.status !== 'archived' ? (
        <Button size="small" disabled={archiveLoading} onClick={() => onArchive(proposal)}>Archive</Button>
      ) : null}
      <IconButton size="small" color="error" disabled={deleteLoading} aria-label={`Delete ${proposal.title}`} onClick={handleDelete}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};

export default ProposalActions;
