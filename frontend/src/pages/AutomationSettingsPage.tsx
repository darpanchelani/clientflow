import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import QueryState from '../components/common/QueryState';
import {
  useAutomationPreferencesQuery,
  useUpdateAutomationPreferencesMutation,
  useUpdateWorkflowRuleMutation,
  useWorkflowRulesQuery,
} from '../hooks/useAutomation';
import { getFriendlyErrorMessage } from '../utils/apiError';

const AutomationSettingsPage = () => {
  const preferencesQuery = useAutomationPreferencesQuery();
  const rulesQuery = useWorkflowRulesQuery();
  const updatePreferences = useUpdateAutomationPreferencesMutation();
  const updateRule = useUpdateWorkflowRuleMutation();
  const [form, setForm] = useState({
    in_app_notifications_enabled: true,
    email_notifications_enabled: false,
    lead_follow_up_days: 7,
    task_due_soon_hours: 24,
    invoice_before_due_days: 3,
    invoice_after_overdue_days: 1,
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setForm({
        in_app_notifications_enabled: preferencesQuery.data.in_app_notifications_enabled,
        email_notifications_enabled: preferencesQuery.data.email_notifications_enabled,
        lead_follow_up_days: preferencesQuery.data.lead_follow_up_days,
        task_due_soon_hours: preferencesQuery.data.task_due_soon_hours,
        invoice_before_due_days: preferencesQuery.data.invoice_before_due_days,
        invoice_after_overdue_days: preferencesQuery.data.invoice_after_overdue_days,
      });
    }
  }, [preferencesQuery.data]);

  const handleNumberChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader title="Automation Settings" description="Control workflow rules, reminders, and notification preferences." />
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <QueryState isLoading={preferencesQuery.isLoading} isError={preferencesQuery.isError} errorMessage={getFriendlyErrorMessage(preferencesQuery.error)} onRetry={() => preferencesQuery.refetch()}>
            <AppCard
              title="Reminder preferences"
              action={
                <Button variant="contained" onClick={() => updatePreferences.mutate(form)} disabled={updatePreferences.isLoading}>
                  Save
                </Button>
              }
            >
              <Stack spacing={2}>
                {updatePreferences.isSuccess ? <Alert severity="success">Preferences saved.</Alert> : null}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>In-app notifications</Typography>
                  <Switch checked={form.in_app_notifications_enabled} onChange={(event) => setForm((current) => ({ ...current, in_app_notifications_enabled: event.target.checked }))} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>Email-ready notifications</Typography>
                  <Switch checked={form.email_notifications_enabled} onChange={(event) => setForm((current) => ({ ...current, email_notifications_enabled: event.target.checked }))} />
                </Stack>
                <TextField label="Lead follow-up after days" type="number" value={form.lead_follow_up_days} onChange={(event) => handleNumberChange('lead_follow_up_days', event.target.value)} />
                <TextField label="Task due soon hours" type="number" value={form.task_due_soon_hours} onChange={(event) => handleNumberChange('task_due_soon_hours', event.target.value)} />
                <TextField label="Invoice reminder before due days" type="number" value={form.invoice_before_due_days} onChange={(event) => handleNumberChange('invoice_before_due_days', event.target.value)} />
                <TextField label="Invoice reminder after overdue days" type="number" value={form.invoice_after_overdue_days} onChange={(event) => handleNumberChange('invoice_after_overdue_days', event.target.value)} />
              </Stack>
            </AppCard>
          </QueryState>
        </Grid>
        <Grid item xs={12} md={7}>
          <QueryState isLoading={rulesQuery.isLoading} isError={rulesQuery.isError} errorMessage={getFriendlyErrorMessage(rulesQuery.error)} onRetry={() => rulesQuery.refetch()}>
            <AppCard title="Workflow rules">
              <List disablePadding>
                {(rulesQuery.data?.results ?? []).map((rule) => (
                  <ListItem key={rule.id} disableGutters divider secondaryAction={
                    <Switch
                      checked={rule.is_active}
                      onChange={(event) => updateRule.mutate({ id: rule.id, payload: { is_active: event.target.checked } })}
                    />
                  }>
                    <ListItemText
                      primary={rule.name}
                      secondary={`${rule.trigger_type.replaceAll('_', ' ')} · ${rule.action_type.replaceAll('_', ' ')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </AppCard>
          </QueryState>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default AutomationSettingsPage;
