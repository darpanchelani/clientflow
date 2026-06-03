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

import LeadDialog from '../components/crm/LeadDialog';
import AppPageHeader from '../components/common/AppPageHeader';
import AppTable, { AppTableColumn } from '../components/common/AppTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useLeadsQuery,
  useUpdateLeadMutation,
  useUpdateLeadStatusMutation,
} from '../hooks/useLeads';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Lead, LeadFormValues } from '../types/crm';
import { extractCursor } from '../utils/pagination';
import { getFriendlyErrorMessage } from '../utils/apiError';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'ads', label: 'Ads' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
];

const LeadsPage = () => {
  const [urlFilters, setUrlFilters] = useUrlFilters({ search: '', status: '', source: '' });
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const confirmDialog = useConfirmDialog();

  const filters = useMemo(
    () => ({ ...urlFilters, cursor }),
    [urlFilters, cursor]
  );

  const query = useLeadsQuery(filters);
  const createMutation = useCreateLeadMutation();
  const updateMutation = useUpdateLeadMutation();
  const deleteMutation = useDeleteLeadMutation();
  const statusMutation = useUpdateLeadStatusMutation();

  const leads = query.data?.results ?? [];
  const nextCursor = extractCursor(query.data?.next);

  const openCreateDialog = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (createMutation.isLoading || updateMutation.isLoading) return;
    setDialogOpen(false);
    setEditingLead(null);
  };

  const handleSave = async (values: LeadFormValues) => {
    if (editingLead) {
      await updateMutation.mutateAsync({ id: editingLead.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditingLead(null);
  };

  const handleDelete = (leadId: number) => {
    confirmDialog.confirm({
      title: 'Delete lead',
      message: 'This lead will be permanently removed from your pipeline.',
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(leadId),
    });
  };

  const handleStatusChange = async (lead: Lead, nextStatus: string) => {
    if (lead.status === nextStatus) return;
    await statusMutation.mutateAsync({ id: lead.id, status: nextStatus });
  };

  const columns: AppTableColumn<Lead>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      getSortValue: (row) => row.name,
      render: (lead) => (
        <Stack spacing={0.25}>
          <strong>{lead.name}</strong>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{lead.email || 'No email'}</span>
        </Stack>
      ),
    },
    {
      id: 'company',
      label: 'Company',
      sortable: true,
      getSortValue: (row) => row.company || '',
      render: (lead) => lead.company || '—',
    },
    {
      id: 'source',
      label: 'Source',
      render: (lead) => <span style={{ textTransform: 'capitalize' }}>{lead.source}</span>,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 160,
      render: (lead) => (
        <Select
          size="small"
          value={lead.status}
          onChange={(event) => handleStatusChange(lead, event.target.value)}
          sx={{ minWidth: 140 }}
          inputProps={{ 'aria-label': `Status for ${lead.name}` }}
        >
          {statusOptions
            .filter((option) => option.value)
            .map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
        </Select>
      ),
    },
    {
      id: 'score',
      label: 'Score',
      sortable: true,
      align: 'right',
      getSortValue: (row) => row.score,
      render: (lead) => lead.score,
    },
    {
      id: 'tags',
      label: 'Tags',
      render: (lead) =>
        lead.tags.length > 0 ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {lead.tags.map((tag) => (
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
      render: (lead) => new Date(lead.updated_at).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      hideable: false,
      render: (lead) => (
        <Stack direction="row" justifyContent="flex-end">
          <IconButton aria-label={`Edit ${lead.name}`} onClick={() => openEditDialog(lead)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label={`Delete ${lead.name}`} onClick={() => handleDelete(lead.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Leads"
        description="Manage prospects, track status changes, and keep the pipeline moving."
        actions={
          <Button variant="contained" onClick={openCreateDialog}>
            New Lead
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
                <MenuItem key={option.value || 'all-statuses'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Source</InputLabel>
            <Select
              label="Source"
              value={urlFilters.source}
              onChange={(event) => {
                setCursor(null);
                setUrlFilters({ source: event.target.value });
              }}
            >
              {sourceOptions.map((option) => (
                <MenuItem key={option.value || 'all-sources'} value={option.value}>
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
          rows={leads}
          columns={columns}
          rowKey={(row) => row.id}
          searchable={(row, q) =>
            [row.name, row.email, row.company, row.source, row.status]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          }
          emptyState={
            <EmptyState
              title="No leads yet"
              description="Start building your pipeline by adding your first lead."
              actionLabel="Create lead"
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

      <LeadDialog
        open={dialogOpen}
        initialLead={editingLead}
        loading={createMutation.isLoading || updateMutation.isLoading}
        onClose={closeDialog}
        onSubmit={handleSave}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default LeadsPage;
