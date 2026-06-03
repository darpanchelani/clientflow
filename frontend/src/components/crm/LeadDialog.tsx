import React, { useEffect } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { leadFormSchema, LeadFormData } from '../../lib/validation/schemas';
import { Lead, LeadFormValues } from '../../types/crm';

interface LeadDialogProps {
  open: boolean;
  initialLead?: Lead | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => Promise<void> | void;
}

const defaultValues: LeadFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'website',
  status: 'new',
  score: 0,
  tagText: '',
};

const LeadDialog = ({ open, initialLead, loading, onClose, onSubmit }: LeadDialogProps) => {
  const form = useForm<LeadFormData>({
    resolver: formResolver(leadFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;

    if (initialLead) {
      form.reset({
        name: initialLead.name,
        email: initialLead.email,
        phone: initialLead.phone,
        company: initialLead.company,
        source: initialLead.source,
        status: initialLead.status,
        score: initialLead.score,
        tagText: initialLead.tags.map((tag) => tag.name).join(', '),
      });
      return;
    }

    form.reset(defaultValues);
  }, [form, initialLead, open]);

  const handleSubmit = async (values: LeadFormData) => {
    const tag_names = (values.tagText || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await onSubmit({
      name: values.name,
      email: values.email || '',
      phone: values.phone || '',
      company: values.company || '',
      source: values.source,
      status: values.status,
      score: Number(values.score) || 0,
      tag_names,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={initialLead ? 'Edit Lead' : 'Create Lead'}
      subtitle="Capture prospect details and pipeline status."
      maxWidth="md"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="lead-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Save Lead
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="lead-form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormTextField<LeadFormData> name="name" label="Name" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<LeadFormData> name="email" label="Email" type="email" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<LeadFormData> name="phone" label="Phone" fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField<LeadFormData> name="company" label="Company" fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<LeadFormData> name="source" label="Source" select fullWidth required>
              <MenuItem value="website">Website</MenuItem>
              <MenuItem value="referral">Referral</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="social">Social</MenuItem>
              <MenuItem value="ads">Ads</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<LeadFormData> name="status" label="Status" select fullWidth required>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="qualified">Qualified</MenuItem>
              <MenuItem value="proposal">Proposal</MenuItem>
              <MenuItem value="won">Won</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormTextField<LeadFormData>
              name="score"
              label="Score"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField<LeadFormData>
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

export default LeadDialog;
