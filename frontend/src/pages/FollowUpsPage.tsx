import React, { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import QueryState from '../components/common/QueryState';
import { useCompleteFollowUpMutation, useFollowUpsQuery } from '../hooks/useAutomation';
import { getFriendlyErrorMessage } from '../utils/apiError';

const FollowUpsPage = () => {
  const [status, setStatus] = useState('');
  const query = useFollowUpsQuery(status ? { status } : {});
  const completeMutation = useCompleteFollowUpMutation();
  const followUps = useMemo(() => query.data?.results ?? [], [query.data?.results]);
  const grouped = useMemo(
    () => ({
      overdue: followUps.filter((item) => item.is_overdue),
      upcoming: followUps.filter((item) => item.status === 'pending' && !item.is_overdue),
      completed: followUps.filter((item) => item.status === 'completed'),
    }),
    [followUps]
  );

  const renderList = (items: typeof followUps) =>
    items.length === 0 ? (
      <Typography color="text.secondary">No follow-ups in this group.</Typography>
    ) : (
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem key={item.id} disableGutters divider secondaryAction={
            item.status === 'pending' ? (
              <Button size="small" onClick={() => completeMutation.mutate(item.id)}>
                Complete
              </Button>
            ) : undefined
          }>
            <ListItemText
              primary={item.lead.name}
              secondary={`${item.lead.company || 'No company'} · Due ${item.due_date}${item.notes ? ` · ${item.notes}` : ''}`}
            />
            <Chip size="small" color={item.is_overdue ? 'error' : item.status === 'completed' ? 'success' : 'default'} label={item.status} />
          </ListItem>
        ))}
      </List>
    );

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Follow-ups"
        description="Lead reminders created by workflow rules and scheduled checks."
        actions={
          <TextField select size="small" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        }
      />
      <QueryState isLoading={query.isLoading} isError={query.isError} errorMessage={getFriendlyErrorMessage(query.error)} onRetry={() => query.refetch()}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <AppCard title="Overdue">{renderList(grouped.overdue)}</AppCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <AppCard title="Upcoming">{renderList(grouped.upcoming)}</AppCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <AppCard title="Completed">{renderList(grouped.completed)}</AppCard>
          </Grid>
        </Grid>
      </QueryState>
    </Stack>
  );
};

export default FollowUpsPage;
