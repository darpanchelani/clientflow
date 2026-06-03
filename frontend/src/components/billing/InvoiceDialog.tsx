import React, { useEffect, useMemo } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import InvoiceItemBuilder from './InvoiceItemBuilder';
import { invoiceFormSchema, InvoiceFormData } from '../../lib/validation/schemas';
import { Client } from '../../types/crm';
import { Project } from '../../types/projects';
import { Invoice, InvoiceFormValues } from '../../types/billing';

interface InvoiceDialogProps {
  open: boolean;
  clients: Client[];
  projects: Project[];
  initialInvoice?: Invoice | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: InvoiceFormValues) => Promise<void> | void;
}

const emptyItem = () => ({ description: '', quantity: '1', unit_price: '0.00' });

const defaultValues: InvoiceFormData = {
  client_id: 0,
  project_id: null,
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  notes: '',
  taxRate: 0,
  items: [emptyItem()],
};

const calcSubtotal = (items: InvoiceFormData['items']) =>
  items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0);

const InvoiceDialog = ({
  open,
  clients,
  projects,
  initialInvoice,
  loading,
  onClose,
  onSubmit,
}: InvoiceDialogProps) => {
  const form = useForm<InvoiceFormData>({
    resolver: formResolver(invoiceFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const clientId = useWatch({ control: form.control, name: 'client_id' });
  const items = useWatch({ control: form.control, name: 'items' }) ?? [];
  const taxRate = useWatch({ control: form.control, name: 'taxRate' }) ?? 0;

  const availableProjects = useMemo(
    () => projects.filter((project) => project.client.id === Number(clientId)),
    [clientId, projects]
  );

  useEffect(() => {
    if (!open) return;

    if (initialInvoice) {
      const subtotal = Number(initialInvoice.subtotal) || 0;
      const taxValue = Number(initialInvoice.tax) || 0;
      form.reset({
        client_id: initialInvoice.client.id,
        project_id: initialInvoice.project?.id ?? null,
        issue_date: initialInvoice.issue_date,
        due_date: initialInvoice.due_date,
        notes: initialInvoice.notes || '',
        taxRate: subtotal > 0 ? Math.round((taxValue / subtotal) * 10000) / 100 : 0,
        items:
          initialInvoice.items.length > 0
            ? initialInvoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
              }))
            : [emptyItem()],
      });
      return;
    }

    form.reset({
      ...defaultValues,
      client_id: clients[0]?.id ?? 0,
      issue_date: new Date().toISOString().slice(0, 10),
    });
  }, [clients, form, initialInvoice, open]);

  useEffect(() => {
    const projectId = form.getValues('project_id');
    if (projectId && !availableProjects.some((project) => project.id === projectId)) {
      form.setValue('project_id', null);
    }
  }, [availableProjects, form]);

  const subtotal = calcSubtotal(items);
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (values: InvoiceFormData) => {
    await onSubmit({
      client_id: Number(values.client_id),
      project_id: values.project_id && values.project_id > 0 ? values.project_id : null,
      issue_date: values.issue_date,
      due_date: values.due_date,
      notes: values.notes || '',
      tax: taxAmount.toFixed(2),
      items: values.items,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialInvoice ? 'Edit Invoice' : 'Create Invoice'}
      subtitle="Configure billing details and line items."
      maxWidth="lg"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="invoice-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Save Invoice
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="invoice-form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormTextField<InvoiceFormData>
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
            <Grid item xs={12} md={4}>
              <FormTextField<InvoiceFormData>
                name="project_id"
                label="Project"
                select
                fullWidth
              >
                <MenuItem value={0}>Optional</MenuItem>
                {availableProjects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormTextField<InvoiceFormData>
                name="issue_date"
                label="Issue date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormTextField<InvoiceFormData>
                name="due_date"
                label="Due date"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormTextField<InvoiceFormData>
                name="taxRate"
                label="Tax rate %"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <FormTextField<InvoiceFormData>
                name="notes"
                label="Notes"
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
          </Grid>

          <InvoiceItemBuilder disabled={loading} />

          {form.formState.errors.items?.message ? (
            <Typography color="error" variant="body2" role="alert">
              {form.formState.errors.items.message as string}
            </Typography>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
            <Typography fontWeight={700}>Subtotal: {subtotal.toFixed(2)}</Typography>
            <Typography fontWeight={700}>Tax: {taxAmount.toFixed(2)}</Typography>
            <Typography fontWeight={700}>Total: {total.toFixed(2)}</Typography>
          </Stack>
        </Stack>
      </AppForm>
    </AppDialog>
  );
};

export default InvoiceDialog;
