import React, { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';

import AppPageHeader from '../components/common/AppPageHeader';
import AppTable, { AppTableColumn } from '../components/common/AppTable';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import { usePaymentsQuery } from '../hooks/usePayments';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Payment } from '../types/billing';
import { getFriendlyErrorMessage } from '../utils/apiError';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters({ search: '', status: '', invoice: '' });

  const query = usePaymentsQuery(filters);
  const payments = useMemo(() => query.data?.results ?? [], [query.data]);

  const columns: AppTableColumn<Payment>[] = [
    {
      id: 'invoice',
      label: 'Invoice',
      sortable: true,
      getSortValue: (row) => row.invoice.invoice_number,
      render: (payment) => (
        <Button
          component={RouterLink}
          to={`/invoices/${payment.invoice.id}`}
          size="small"
          sx={{ fontWeight: 700 }}
        >
          {payment.invoice.invoice_number}
        </Button>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      getSortValue: (row) => Number(row.amount),
      render: (payment) => payment.amount,
    },
    {
      id: 'method',
      label: 'Method',
      render: (payment) => (
        <span style={{ textTransform: 'capitalize' }}>{payment.payment_method.replace('_', ' ')}</span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (payment) => (
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
      ),
    },
    {
      id: 'transaction',
      label: 'Transaction',
      render: (payment) => payment.transaction_id || 'Not provided',
    },
    {
      id: 'paid',
      label: 'Paid at',
      sortable: true,
      getSortValue: (row) => (row.paid_at ? new Date(row.paid_at).getTime() : 0),
      render: (payment) => (payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'Not paid'),
    },
  ];

  const filteredByInvoice = useMemo(() => {
    if (!filters.invoice) return payments;
    return payments.filter((payment) => String(payment.invoice.id) === filters.invoice);
  }, [filters.invoice, payments]);

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Payments"
        description="Track payment activity across invoices and settlement status."
        actions={
          <Button component={RouterLink} to="/invoices" variant="contained">
            Go to invoices
          </Button>
        }
      />

      <FilterBar>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search"
            value={filters.search}
            onChange={(event) => setFilters({ search: event.target.value })}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters({ status: event.target.value })}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Invoice ID"
            value={filters.invoice}
            onChange={(event) => setFilters({ invoice: event.target.value })}
            fullWidth
          />
        </Grid>
      </FilterBar>

      <QueryState
        isLoading={query.isLoading && !query.data}
        isError={query.isError}
        errorMessage={getFriendlyErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      >
        <AppTable
          rows={filteredByInvoice}
          columns={columns}
          rowKey={(row) => row.id}
          searchable={(row, q) =>
            [row.invoice.invoice_number, row.amount, row.payment_method, row.status, row.transaction_id]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          }
          emptyState={
            <EmptyState
              title="No payments recorded"
              description="Payments appear here when invoices are paid or partial payments are logged."
              actionLabel="View invoices"
              onAction={() => navigate('/invoices')}
            />
          }
        />
      </QueryState>
    </Stack>
  );
};

export default PaymentsPage;
