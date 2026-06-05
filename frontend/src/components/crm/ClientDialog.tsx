import React, { useEffect, useMemo, useState } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Autocomplete, Button, Grid, MenuItem, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { clientFormSchema, ClientFormData } from '../../lib/validation/schemas';
import { Client, ClientFormValues, Lead } from '../../types/crm';
import { useLeadsQuery } from '../../hooks/useLeads';
import { getFriendlyErrorMessage } from '../../utils/apiError';

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
  tagText: '',
};

type LeadOption = Pick<Lead, 'id' | 'name' | 'email' | 'company' | 'status' | 'source'>;

const leadLabel = (lead: LeadOption) =>
  [lead.name, lead.email, lead.company].filter(Boolean).join(' · ');

const ClientDialog = ({ open, initialClient, loading, onClose, onSubmit }: ClientDialogProps) => {
  const leadsQuery = useLeadsQuery({});
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const form = useForm<ClientFormData>({
    resolver: formResolver(clientFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const leadOptions = useMemo<LeadOption[]>(() => {
    const options = leadsQuery.data?.results ?? [];
    if (initialClient?.lead && !options.some((lead) => lead.id === initialClient.lead?.id)) {
      return [initialClient.lead, ...options];
    }
    return options;
  }, [initialClient?.lead, leadsQuery.data?.results]);

  useEffect(() => {
    if (!open) return;

    if (initialClient) {
      form.reset({
        name: initialClient.name,
        email: initialClient.email,
        phone: initialClient.phone,
        company: initialClient.company,
        status: initialClient.status,
        tagText: initialClient.tags.map((tag) => tag.name).join(', '),
      });
      setSelectedLead(initialClient.lead);
      return;
    }

    form.reset(defaultValues);
    setSelectedLead(null);
  }, [form, initialClient, open]);

  const handleSubmit = async (values: ClientFormData) => {
    const tag_names = (values.tagText || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await onSubmit({
      name: values.name,
      email: values.email || '',
      phone: values.phone || '',
      company: values.company || '',
      status: values.status,
      lead_id: selectedLead?.id ?? null,
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
            <Autocomplete
              options={leadOptions}
              value={selectedLead}
              onChange={(_, value) => setSelectedLead(value)}
              getOptionLabel={leadLabel}
              loading={leadsQuery.isLoading}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={leadsQuery.isError ? 'Unable to load leads' : 'No leads found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lead"
                  helperText={
                    leadsQuery.isError
                      ? getFriendlyErrorMessage(leadsQuery.error, 'Unable to load leads.')
                      : 'Optional lead conversion reference'
                  }
                />
              )}
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
