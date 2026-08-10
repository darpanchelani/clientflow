import React from 'react';
import { Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

import AppCard from '../common/AppCard';
import EmptyState from '../common/EmptyState';
import TableSkeleton from '../skeletons/TableSkeleton';
import { Payment } from '../../types/billing';

interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  onVerify?: (payment: Payment) => void;
}

const PaymentHistory = ({ payments, loading, onVerify }: PaymentHistoryProps) => {
  if (loading) {
    return <TableSkeleton rows={4} columns={6} />;
  }

  return (
    <AppCard title="Payment history" subtitle="Recorded payments for this invoice">
      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payments will appear here when recorded or when the invoice is marked as paid."
        />
      ) : (
        <Stack sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Payment history">
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction</TableCell>
                <TableCell>Paid at</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {payment.payment_method.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={payment.status}
                      color={
                        payment.status === 'completed'
                          ? 'success'
                          : payment.status === 'failed'
                            ? 'error'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{payment.transaction_id || 'Not provided'}</TableCell>
                  <TableCell>
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'Not paid'}
                  </TableCell>
                  <TableCell align="right">
                    {payment.status === 'pending' && onVerify ? (
                      <Button size="small" onClick={() => onVerify(payment)}>
                        Verify
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      )}
    </AppCard>
  );
};

export default PaymentHistory;
