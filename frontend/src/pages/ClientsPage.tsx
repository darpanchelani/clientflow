import React, { useMemo, useState } from 'react';
import {
  Button,
  Chip,
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

import ClientDialog from '../components/crm/ClientDialog';
import AppPageHeader from '../components/common/AppPageHeader';
import AppTable, { AppTableColumn } from '../components/common/AppTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  useClientsQuery,
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from '../hooks/useClients';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Client, ClientFormValues } from '../types/crm';
import { extractCursor } from '../utils/pagination';
import { getFriendlyErrorMessage } from '../utils/apiError';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const ClientsPage = () => {
  const [urlFilters, setUrlFilters] = useUrlFilters({ search: '', status: '' });
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const confirmDialog = useConfirmDialog();

  const filters = useMemo(() => ({ ...urlFilters, cursor }), [urlFilters, cursor]);

  const query = useClientsQuery(filters);
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();

  const clients = query.data?.results ?? [];
  const nextCursor = extractCursor(query.data?.next);

  const openCreateDialog = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (createMutation.isLoading || updateMutation.isLoading) return;
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleSave = async (values: ClientFormValues) => {
    if (editingClient) {
      await updateMutation.mutateAsync({ id: editingClient.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    closeDialog();
  };

  const columns: AppTableColumn<Client>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      getSortValue: (row) => row.name,
      render: (client) => (
        <Stack spacing={0.25}>
          <strong>{client.name}</strong>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{client.email || 'No email'}</span>
        </Stack>
      ),
    },
    {
      id: 'lead',
      label: 'Lead',
      render: (client) => client.lead?.name ?? '—',
    },
    {
      id: 'company',
      label: 'Company',
      sortable: true,
      getSortValue: (row) => row.company || '',
      render: (client) => client.company || '—',
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (row) => row.status,
      render: (client) => <span style={{ textTransform: 'capitalize' }}>{client.status}</span>,
    },
    {
      id: 'tags',
      label: 'Tags',
      render: (client) =>
        client.tags.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {client.tags.map((tag) => (
              <Chip key={tag.id} size="small" label={tag.name} />
            ))}
          </Stack>
        ) : (
          '—'
        ),
    },
    {
      id: 'updated',
      label: 'Updated',
      sortable: true,
      getSortValue: (row) => new Date(row.updated_at).getTime(),
      render: (client) => new Date(client.updated_at).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      hideable: false,
      render: (client) => (
        <Stack direction="row" justifyContent="flex-end">
          <IconButton
            aria-label={`Edit ${client.name}`}
            onClick={() => {
              setEditingClient(client);
              setDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${client.name}`}
            onClick={() =>
              confirmDialog.confirm({
                title: 'Delete client',
                message: 'This client and related links will be removed.',
                destructive: true,
                confirmLabel: 'Delete',
                onConfirm: () => deleteMutation.mutateAsync(client.id),
              })
            }
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Clients"
        description="Keep active accounts organized and connected to the original lead when needed."
        actions={
          <Button variant="contained" onClick={openCreateDialog}>
            New Client
          </Button>
        }
      />

      <FilterBar>
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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
                <MenuItem key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
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
          rows={clients}
          columns={columns}
          rowKey={(row) => row.id}
          searchable={(row, q) =>
            [row.name, row.email, row.company, row.status, row.lead?.name]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          }
          emptyState={
            <EmptyState
              title="No clients yet"
              description="Convert leads or add clients directly to start managing accounts."
              actionLabel="Add client"
              onAction={openCreateDialog}
            />
          }
        />
      </QueryState>

      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={!nextCursor || query.isFetching}
          onClick={() => setCursor(nextCursor)}
        >
          Load more
        </Button>
      </Stack>

      <ClientDialog
        open={dialogOpen}
        initialClient={editingClient}
        loading={createMutation.isLoading || updateMutation.isLoading}
        onClose={closeDialog}
        onSubmit={handleSave}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default ClientsPage;
