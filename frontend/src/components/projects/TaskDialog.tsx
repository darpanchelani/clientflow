import React, { useEffect } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { taskFormSchema, TaskFormData } from '../../lib/validation/schemas';
import { Task, TaskFormValues, UserSummary } from '../../types/projects';

interface TaskDialogProps {
  open: boolean;
  projectId: number;
  users: UserSummary[];
  initialTask?: Task | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
}

const defaultValues: TaskFormData = {
  title: '',
  description: '',
  assigned_to_id: null,
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

const TaskDialog = ({
  open,
  projectId,
  users,
  initialTask,
  loading,
  onClose,
  onSubmit,
}: TaskDialogProps) => {
  const form = useForm<TaskFormData>({
    resolver: formResolver(taskFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;

    if (initialTask) {
      form.reset({
        title: initialTask.title,
        description: initialTask.description,
        assigned_to_id: initialTask.assigned_to?.id ?? null,
        status: initialTask.status,
        priority: initialTask.priority,
        due_date: initialTask.due_date || '',
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialTask, open]);

  const handleSubmit = async (values: TaskFormData) => {
    await onSubmit({
      title: values.title,
      description: values.description || '',
      project_id: projectId,
      assigned_to_id:
        values.assigned_to_id === null || values.assigned_to_id === undefined
          ? null
          : Number(values.assigned_to_id),
      status: values.status,
      priority: values.priority,
      due_date: values.due_date || null,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Create Task'}
      subtitle="Assign work, set priority, and track due dates."
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="task-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Save Task
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="task-form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormTextField<TaskFormData> name="title" label="Title" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<TaskFormData>
              name="assigned_to_id"
              label="Assignee"
              select
              fullWidth
            >
              <MenuItem value="">Unassigned</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.first_name || user.email} ({user.role})
                </MenuItem>
              ))}
            </FormTextField>
          </Grid>
          <Grid item xs={12}>
            <FormTextField<TaskFormData>
              name="description"
              label="Description"
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<TaskFormData> name="status" label="Status" select fullWidth required>
              <MenuItem value="todo">Todo</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<TaskFormData> name="priority" label="Priority" select fullWidth required>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<TaskFormData>
              name="due_date"
              label="Due date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
        </Grid>
      </AppForm>
    </AppDialog>
  );
};

export default TaskDialog;
