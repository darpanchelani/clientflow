import React, { useEffect } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { projectFormSchema, ProjectFormData } from '../../lib/validation/schemas';
import { Client } from '../../types/crm';
import { Project, ProjectFormValues } from '../../types/projects';

interface ProjectDialogProps {
  open: boolean;
  initialProject?: Project | null;
  clients: Client[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
}

const defaultValues: ProjectFormData = {
  name: '',
  description: '',
  client_id: 0,
  status: 'active',
  start_date: '',
  end_date: '',
};

const ProjectDialog = ({
  open,
  initialProject,
  clients,
  loading,
  onClose,
  onSubmit,
}: ProjectDialogProps) => {
  const form = useForm<ProjectFormData>({
    resolver: formResolver(projectFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;

    if (initialProject) {
      form.reset({
        name: initialProject.name,
        description: initialProject.description,
        client_id: initialProject.client.id,
        status: initialProject.status,
        start_date: initialProject.start_date || '',
        end_date: initialProject.end_date || '',
      });
      return;
    }

    form.reset({
      ...defaultValues,
      client_id: clients[0]?.id ?? 0,
    });
  }, [clients, form, initialProject, open]);

  const handleSubmit = async (values: ProjectFormData) => {
    await onSubmit({
      name: values.name,
      description: values.description || '',
      client_id: Number(values.client_id),
      status: values.status as ProjectFormValues['status'],
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialProject ? 'Edit Project' : 'Create Project'}
      subtitle="Define scope, timeline, and client ownership."
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="project-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Save Project
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="project-form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormTextField<ProjectFormData> name="name" label="Name" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ProjectFormData>
              name="client_id"
              label="Client"
              select
              fullWidth
              required
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </FormTextField>
          </Grid>
          <Grid item xs={12}>
            <FormTextField<ProjectFormData>
              name="description"
              label="Description"
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<ProjectFormData> name="status" label="Status" select fullWidth required>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<ProjectFormData>
              name="start_date"
              label="Start date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<ProjectFormData>
              name="end_date"
              label="End date"
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

export default ProjectDialog;
