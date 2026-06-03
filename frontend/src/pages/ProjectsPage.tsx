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

import ProjectDialog from '../components/projects/ProjectDialog';
import AppPageHeader from '../components/common/AppPageHeader';
import AppTable, { AppTableColumn } from '../components/common/AppTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import { useClientsQuery } from '../hooks/useClients';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useProjectsQuery,
  useUpdateProjectMutation,
} from '../hooks/useProjects';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { Project, ProjectFormValues } from '../types/projects';
import { extractCursor } from '../utils/pagination';
import { getFriendlyErrorMessage } from '../utils/apiError';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [urlFilters, setUrlFilters] = useUrlFilters({
    search: '',
    status: '',
    client: '',
    start_date_after: '',
    start_date_before: '',
    end_date_after: '',
    end_date_before: '',
  });
  const [cursor, setCursor] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const confirmDialog = useConfirmDialog();

  const filters = useMemo(() => ({ ...urlFilters, cursor }), [urlFilters, cursor]);

  const query = useProjectsQuery(filters);
  const clientQuery = useClientsQuery({});
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const projects = query.data?.results ?? [];
  const nextCursor = extractCursor(query.data?.next);
  const clients = clientQuery.data?.results ?? [];

  const columns: AppTableColumn<Project>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      getSortValue: (row) => row.name,
      render: (project) => (
        <Stack spacing={0.25}>
          <Button
            variant="text"
            onClick={() => navigate(`/projects/${project.id}`)}
            sx={{ justifyContent: 'flex-start', p: 0, fontWeight: 700, textTransform: 'none' }}
          >
            {project.name}
          </Button>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {project.description || 'No description'}
          </span>
        </Stack>
      ),
    },
    {
      id: 'client',
      label: 'Client',
      sortable: true,
      getSortValue: (row) => row.client.name,
      render: (project) => project.client.name,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (row) => row.status,
      render: (project) => <span style={{ textTransform: 'capitalize' }}>{project.status}</span>,
    },
    {
      id: 'dates',
      label: 'Dates',
      render: (project) => (
        <Stack spacing={0.25}>
          <span>{project.start_date || 'No start'}</span>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{project.end_date || 'No end'}</span>
        </Stack>
      ),
    },
    {
      id: 'owner',
      label: 'Owner',
      render: (project) => project.owner.email,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      hideable: false,
      render: (project) => (
        <Stack direction="row" justifyContent="flex-end">
          <IconButton
            aria-label={`Edit ${project.name}`}
            onClick={() => {
              setEditingProject(project);
              setDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${project.name}`}
            onClick={() =>
              confirmDialog.confirm({
                title: 'Delete project',
                message: 'Tasks and related data for this project may be removed.',
                destructive: true,
                confirmLabel: 'Delete',
                onConfirm: () => deleteMutation.mutateAsync(project.id),
              })
            }
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const handleSave = async (values: ProjectFormValues) => {
    if (editingProject) {
      await updateMutation.mutateAsync({ id: editingProject.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    setEditingProject(null);
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Projects"
        description="Track delivery, filter by client, and open each project detail board."
        actions={
          <Button variant="contained" onClick={() => { setEditingProject(null); setDialogOpen(true); }}>
            New Project
          </Button>
        }
      />

      <FilterBar>
        <Grid item xs={12} md={3}>
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
        <Grid item xs={12} md={2}>
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
        <Grid item xs={12} md={2}>
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
        <Grid item xs={12} md={2}>
          <TextField
            label="Start after"
            type="date"
            value={urlFilters.start_date_after}
            onChange={(event) => {
              setCursor(null);
              setUrlFilters({ start_date_after: event.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="End before"
            type="date"
            value={urlFilters.end_date_before}
            onChange={(event) => {
              setCursor(null);
              setUrlFilters({ end_date_before: event.target.value });
            }}
            InputLabelProps={{ shrink: true }}
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
          rows={projects}
          columns={columns}
          rowKey={(row) => row.id}
          searchable={(row, q) =>
            [row.name, row.description, row.client.name, row.status, row.owner.email]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          }
          emptyState={
            <EmptyState
              title="No projects yet"
              description="Create a project to organize tasks and track delivery for a client."
              actionLabel="Create project"
              onAction={() => { setEditingProject(null); setDialogOpen(true); }}
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

      <ProjectDialog
        open={dialogOpen}
        initialProject={editingProject}
        clients={clients}
        loading={createMutation.isLoading || updateMutation.isLoading}
        onClose={() => {
          if (createMutation.isLoading || updateMutation.isLoading) return;
          setDialogOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default ProjectsPage;
