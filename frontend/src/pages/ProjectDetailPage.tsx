import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
} from '@mui/material';

import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import FilterBar from '../components/common/FilterBar';
import QueryState from '../components/common/QueryState';
import TaskBoard from '../components/projects/TaskBoard';
import TaskDialog from '../components/projects/TaskDialog';
import BoardSkeleton from '../components/skeletons/BoardSkeleton';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useProjectQuery } from '../hooks/useProjects';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useTaskBoardQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
} from '../hooks/useTasks';
import { useUsersQuery } from '../hooks/useUsers';
import { Task, TaskFormValues } from '../types/projects';
import { getFriendlyErrorMessage } from '../utils/apiError';

const ProjectDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const projectId = Number(params.projectId);
  const [assigneeFilter, setAssigneeFilter] = useState<number | ''>('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const confirmDialog = useConfirmDialog();

  const projectQuery = useProjectQuery(Number.isNaN(projectId) ? undefined : projectId);
  const usersQuery = useUsersQuery();

  const taskFilters = useMemo(
    () => ({
      project: projectId,
      assigned_to: assigneeFilter,
      priority: priorityFilter,
    }),
    [projectId, assigneeFilter, priorityFilter]
  );

  const isValidProject = !Number.isNaN(projectId);
  const boardQuery = useTaskBoardQuery(taskFilters, isValidProject);
  const createMutation = useCreateTaskMutation(taskFilters);
  const updateMutation = useUpdateTaskMutation(taskFilters);
  const deleteMutation = useDeleteTaskMutation(taskFilters);
  const statusMutation = useUpdateTaskStatusMutation(taskFilters);

  const users = usersQuery.data ?? [];
  const board = boardQuery.data;
  const selectedProject = projectQuery.data;
  const totalTasks = board
    ? board.todo.length + board.in_progress.length + board.review.length + board.done.length
    : 0;

  const handleSaveTask = async (values: TaskFormValues) => {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, payload: values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  if (Number.isNaN(projectId)) {
    return (
      <Alert severity="error" action={<Button onClick={() => navigate('/projects')}>Back</Button>}>
        Invalid project.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Button onClick={() => navigate('/projects')} sx={{ alignSelf: 'flex-start' }}>
        Back to projects
      </Button>

      <AppPageHeader
        title={selectedProject?.name || 'Project'}
        description={selectedProject?.description || 'Project overview and task board.'}
        actions={
          <Button variant="contained" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
            New Task
          </Button>
        }
      />

      {projectQuery.isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => projectQuery.refetch()}>Retry</Button>}
        >
          {getFriendlyErrorMessage(projectQuery.error)}
        </Alert>
      ) : null}

      {selectedProject ? (
        <AppCard>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack spacing={0.5}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Client</span>
                <strong>{selectedProject.client.name}</strong>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack spacing={0.5}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Owner</span>
                <strong>{selectedProject.owner.email}</strong>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                <Chip label={selectedProject.status} sx={{ alignSelf: 'flex-start', textTransform: 'capitalize' }} />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Start</span>
                <strong>{selectedProject.start_date || '—'}</strong>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Stack spacing={0.5}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>End</span>
                <strong>{selectedProject.end_date || '—'}</strong>
              </Stack>
            </Grid>
          </Grid>
        </AppCard>
      ) : null}

      <FilterBar>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <Select
              label="Assignee"
              value={assigneeFilter}
              onChange={(event) =>
                setAssigneeFilter(event.target.value === '' ? '' : Number(event.target.value))
              }
            >
              <MenuItem value="">All assignees</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.first_name || user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <MenuItem value="">All priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </FilterBar>

      <QueryState
        isLoading={boardQuery.isLoading && !board}
        isError={boardQuery.isError}
        errorMessage={getFriendlyErrorMessage(boardQuery.error)}
        onRetry={() => boardQuery.refetch()}
        skeleton="none"
      >
        {boardQuery.isLoading && !board ? (
          <BoardSkeleton />
        ) : board ? (
          totalTasks === 0 ? (
            <EmptyState
              title="No tasks on this board"
              description="Create tasks to track work across todo, in progress, review, and done."
              actionLabel="Add task"
              onAction={() => { setEditingTask(null); setTaskDialogOpen(true); }}
            />
          ) : (
            <TaskBoard
              board={board}
              onMoveTask={(taskId, status) => statusMutation.mutateAsync({ id: taskId, status })}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskDialogOpen(true);
              }}
              onDeleteTask={(taskId) =>
                confirmDialog.confirm({
                  title: 'Delete task',
                  message: 'This task will be removed from the board.',
                  destructive: true,
                  confirmLabel: 'Delete',
                  onConfirm: () => deleteMutation.mutateAsync(taskId),
                })
              }
            />
          )
        ) : null}
      </QueryState>

      <TaskDialog
        open={taskDialogOpen}
        projectId={projectId}
        users={users}
        initialTask={editingTask}
        loading={createMutation.isLoading || updateMutation.isLoading}
        onClose={() => {
          if (createMutation.isLoading || updateMutation.isLoading) return;
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default ProjectDetailPage;
