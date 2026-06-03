import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import InvoiceDialog from '../components/billing/InvoiceDialog';
import InvoiceStatusBadge from '../components/billing/InvoiceStatusBadge';
import AppPageHeader from '../components/common/AppPageHeader';
import AppTable, { AppTableColumn } from '../components/common/AppTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import { useClientsQuery } from '../hooks/useClients';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  useInvoicesQuery,
  useCreateInvoiceMutation,
  useDeleteInvoiceMutation,
  useUpdateInvoiceMutation,
} from '../hooks/useInvoices';
import { useProjectsQuery } from '../hooks/useProjects';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Invoice, InvoiceFormValues } from '../types/billing';
import { extractCursor } from '../utils/pagination';
import { getFriendlyErrorMessage } from '../utils/apiError';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [urlFilters, setUrlFilters] = useUrlFilters({ search: '', status: '', client: '' });
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const confirmDialog = useConfirmDialog();

  const filters = useMemo(() => ({ ...urlFilters, cursor }), [urlFilters, cursor]);

  const query = useInvoicesQuery(filters);
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});
  const createMutation = useCreateInvoiceMutation();
  const updateMutation = useUpdateInvoiceMutation();
  const deleteMutation = useDeleteInvoiceMutation();

  const invoices = query.data?.results ?? [];
  const nextCursor = extractCursor(query.data?.next);
  const prevCursor = extractCursor(query.data?.previous);
  const clients = clientsQuery.data?.results ?? [];
  const projects = projectsQuery.data?.results ?? [];

  const dialogClients = useMemo(() => {
    if (!editingInvoice?.client) return clients;
    return clients.some((client) => client.id === editingInvoice.client.id)
      ? clients
      : [editingInvoice.client, ...clients];
  }, [clients, editingInvoice]);

  const dialogProjects = useMemo(() => {
    if (!editingInvoice?.project) return projects;
    return projects.some((project) => project.id === editingInvoice.project?.id)
      ? projects
      : [editingInvoice.project, ...projects];
  }, [editingInvoice, projects]);

  const columns: AppTableColumn<Invoice>[] = [
    {
      id: 'number',
      label: 'Invoice',
      sortable: true,
      getSortValue: (row) => row.invoice_number,
      render: (invoice) => (
        <Button
          variant="text"
          onClick={() => navigate(`/invoices/${invoice.id}`)}
          sx={{ p: 0, fontWeight: 700, textTransform: 'none' }}
        >
          {invoice.invoice_number}
        </Button>
      ),
    },
    {
      id: 'client',
      label: 'Client',
      render: (invoice) => invoice.client?.name ?? '—',
    },
    {
      id: 'project',
      label: 'Project',
      render: (invoice) => invoice.project?.name ?? '—',
    },
    {
      id: 'status',
      label: 'Status',
      render: (invoice) => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      id: 'total',
      label: 'Total',
      sortable: true,
      align: 'right',
      getSortValue: (row) => Number(row.total),
      render: (invoice) => invoice.total,
    },
    {
      id: 'due',
      label: 'Due',
      sortable: true,
      getSortValue: (row) => row.due_date,
      render: (invoice) => invoice.due_date,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      hideable: false,
      render: (invoice) => (
        <Stack direction="row" justifyContent="flex-end">
          <IconButton
            aria-label={`Edit ${invoice.invoice_number}`}
            disabled={invoice.status !== 'draft'}
            onClick={() => {
              setEditingInvoice(invoice);
              setDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${invoice.invoice_number}`}
            onClick={() =>
              confirmDialog.confirm({
                title: 'Delete invoice',
                message: 'This invoice will be permanently removed.',
                destructive: true,
                confirmLabel: 'Delete',
                onConfirm: () => deleteMutation.mutateAsync(invoice.id),
              })
            }
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const handleSave = async (values: InvoiceFormValues) => {
    if (editingInvoice) {
      await updateMutation.mutateAsync({ id: editingInvoice.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditingInvoice(null);
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Invoices"
        description="Track billing, filter by status, and open invoice details for payment history."
        actions={
          <Button variant="contained" onClick={() => { setEditingInvoice(null); setDialogOpen(true); }}>
            New Invoice
          </Button>
        }
      />

      <FilterBar>
        <Grid item xs={12} md={4}>
          <TextField
            label="Search"
            value={urlFilters.search}
            onChange={(event) => {
              setCursor(null);
              setUrlFilters({ search: event.target.value });
            }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={urlFilters.status}
              onChange={(event) => {
                setCursor(null);
                setUrlFilters({ status: event.target.value });
              }}
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
          <FormControl fullWidth>
            <InputLabel>Client</InputLabel>
            <Select
              label="Client"
              value={urlFilters.client}
              onChange={(event) => {
                setCursor(null);
                setUrlFilters({ client: event.target.value });
              }}
            >
              <MenuItem value="">All clients</MenuItem>
              {clients.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </FilterBar>

      <QueryState
        isLoading={query.isLoading && !query.data}
        isError={query.isError}
        errorMessage={getFriendlyErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      >
        <AppTable
          rows={invoices}
          columns={columns}
          rowKey={(row) => row.id}
          searchable={(row, q) =>
            [row.invoice_number, row.client?.name, row.project?.name, row.status, row.total]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          }
          emptyState={
            <EmptyState
              title="No invoices yet"
              description="Create your first invoice to start tracking billing and payments."
              actionLabel="Create invoice"
              onAction={() => { setEditingInvoice(null); setDialogOpen(true); }}
            />
          }
        />
      </QueryState>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" disabled={!prevCursor || query.isFetching} onClick={() => setCursor(prevCursor)}>
          Previous
        </Button>
        <Button variant="outlined" disabled={!nextCursor || query.isFetching} onClick={() => setCursor(nextCursor)}>
          Next
        </Button>
      </Stack>

      <InvoiceDialog
        open={dialogOpen}
        clients={dialogClients}
        projects={dialogProjects}
        initialInvoice={editingInvoice}
        loading={createMutation.isLoading || updateMutation.isLoading}
        onClose={() => {
          if (createMutation.isLoading || updateMutation.isLoading) return;
          setDialogOpen(false);
          setEditingInvoice(null);
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default InvoicesPage;
