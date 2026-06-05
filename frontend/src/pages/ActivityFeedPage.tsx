import React, { useState } from 'react';
import { Chip, List, ListItem, ListItemText, MenuItem, Stack, TextField, Typography } from '@mui/material';

import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import QueryState from '../components/common/QueryState';
import { useActivityFeedQuery } from '../hooks/useAutomation';
import { getFriendlyErrorMessage } from '../utils/apiError';

const ActivityFeedPage = () => {
  const [source, setSource] = useState('');
  const query = useActivityFeedQuery(source ? { source } : {});
  const activities = query.data?.results ?? [];

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Activity Feed"
        description="Global workflow activity across CRM, projects, tasks, and billing."
        actions={
          <TextField select size="small" label="Source" value={source} onChange={(event) => setSource(event.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="lead">Leads</MenuItem>
            <MenuItem value="client">Clients</MenuItem>
            <MenuItem value="project">Projects</MenuItem>
            <MenuItem value="task">Tasks</MenuItem>
            <MenuItem value="invoice">Invoices</MenuItem>
            <MenuItem value="payment">Payments</MenuItem>
          </TextField>
        }
      />
      <QueryState isLoading={query.isLoading} isError={query.isError} errorMessage={getFriendlyErrorMessage(query.error)} onRetry={() => query.refetch()}>
        <AppCard title="Timeline">
          {activities.length === 0 ? (
            <Typography color="text.secondary">No activity has been recorded yet.</Typography>
          ) : (
            <List disablePadding>
              {activities.map((activity) => (
                <ListItem key={activity.id} disableGutters divider>
                  <ListItemText
                    primary={activity.message}
                    secondary={`${activity.actor?.email ?? 'System'} · ${new Date(activity.created_at).toLocaleString()}`}
                  />
                  <Chip size="small" label={activity.source} sx={{ textTransform: 'capitalize' }} />
                </ListItem>
              ))}
            </List>
          )}
        </AppCard>
      </QueryState>
    </Stack>
  );
};

export default ActivityFeedPage;
