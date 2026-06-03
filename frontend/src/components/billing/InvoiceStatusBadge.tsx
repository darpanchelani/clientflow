import React from 'react';
import { Chip } from '@mui/material';

import { Invoice } from '../../types/billing';

const colorMap: Record<Invoice['status'], 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  sent: 'primary',
  paid: 'success',
  overdue: 'error',
  cancelled: 'warning',
};

const InvoiceStatusBadge = ({ status }: { status: Invoice['status'] }) => {
  return <Chip size="small" label={status} color={colorMap[status]} />;
};

export default InvoiceStatusBadge;

