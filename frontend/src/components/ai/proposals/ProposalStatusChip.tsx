import React from 'react';
import { Chip, ChipProps } from '@mui/material';

import { ProposalDraft } from '../../../types/ai';

const statusColor: Record<ProposalDraft['status'], ChipProps['color']> = {
  draft: 'info',
  approved: 'success',
  archived: 'warning',
};

interface ProposalStatusChipProps {
  status: ProposalDraft['status'];
}

const ProposalStatusChip = ({ status }: ProposalStatusChipProps) => (
  <Chip
    size="small"
    color={statusColor[status]}
    label={status}
    sx={{ textTransform: 'capitalize' }}
  />
);

export default ProposalStatusChip;
