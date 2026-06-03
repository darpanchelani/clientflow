import React, { useEffect } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { clientFormSchema, ClientFormData } from '../../lib/validation/schemas';
import { Client, ClientFormValues } from '../../types/crm';

interface ClientDialogProps {
  open: boolean;
  initialClient?: Client | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
}

const defaultValues: ClientFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'active',
  leadId: '',
  tagText: '',
};

const ClientDialog = ({ open, initialClient, loading, onClose, onSubmit }: ClientDialogProps) => {
  const form = useForm<ClientFormData>({
    resolver: formResolver(clientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;

    if (initialClient) {
      form.reset({
        name: initialClient.name,
        email: initialClient.email,
        phone: initialClient.phone,
        company: initialClient.company,
        status: initialClient.status,
        leadId: initialClient.lead?.id ? String(initialClient.lead.id) : '',
        tagText: initialClient.tags.map((tag) => tag.name).join(', '),
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialClient, open]);

  const handleSubmit = async (values: ClientFormData) => {
    const tag_names = (values.tagText || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const lead_id = values.leadId?.trim() ? Number(values.leadId) : null;

    await onSubmit({
      name: values.name,
      email: values.email || '',
      phone: values.phone || '',
      company: values.company || '',
      status: values.status,
      lead_id: Number.isNaN(lead_id as number) ? null : lead_id,
      tag_names,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialClient ? 'Edit Client' : 'Create Client'}
      subtitle="Manage client contact details and lifecycle status."
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="client-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Save Client
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="client-form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData> name="name" label="Name" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData> name="email" label="Email" type="email" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData> name="phone" label="Phone" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData> name="company" label="Company" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData>
              name="leadId"
              label="Lead ID"
              fullWidth
              helperText="Optional lead conversion reference"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<ClientFormData> name="status" label="Status" select fullWidth required>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12}>
            <FormTextField<ClientFormData>
              name="tagText"
              label="Tags"
              helperText="Comma-separated tag names"
              fullWidth
            />
          </Grid>
        </Grid>
      </AppForm>
    </AppDialog>
  );
};

export default ClientDialog;
