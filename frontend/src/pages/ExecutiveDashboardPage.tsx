import React, { useState } from 'react';
import { Grid, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import AnalyticsFilterBar from '../components/analytics/AnalyticsFilterBar';
import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import QueryState from '../components/common/QueryState';
import KpiCard from '../components/dashboard/KpiCard';
import { useAnalyticsDashboardQuery } from '../hooks/useAnalytics';
import { useClientsQuery } from '../hooks/useClients';
import { useProjectsQuery } from '../hooks/useProjects';
import { useUsersQuery } from '../hooks/useUsers';
import { AnalyticsFilters } from '../types/analytics';
import { getFriendlyErrorMessage } from '../utils/apiError';

const money = (value: string | number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value));

const ExecutiveDashboardPage = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({ range: 'last_quarter' });
  const query = useAnalyticsDashboardQuery(filters);
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});
  const usersQuery = useUsersQuery();
  const data = query.data;

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Executive Dashboard"
        description="Management-level KPIs for revenue, clients, projects, and team workload."
        actions={<AnalyticsFilterBar filters={filters} onChange={setFilters} clients={clientsQuery.data?.results ?? []} projects={projectsQuery.data?.results ?? []} users={usersQuery.data ?? []} />}
      />
      <QueryState isLoading={query.isLoading} isError={query.isError} errorMessage={getFriendlyErrorMessage(query.error)} onRetry={() => query.refetch()} skeleton="dashboard">
        {data ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard label="Total revenue" value={money(data.revenue.total_revenue)} hint="Selected range" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard label="Forecast" value={money(data.sales_funnel.revenue_forecast)} hint="Weighted pipeline" accent="#0f9d8a" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard label="Client growth" value={`${data.clients.growth_rate}%`} hint={`${data.clients.new} new`} accent="#7c3aed" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard label="Delayed projects" value={data.projects.delayed} hint="Past end date" accent="#dc2626" />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <AppCard title="Revenue metrics">
                  <Stack spacing={1}>
                    <Typography>Outstanding: {money(data.revenue.outstanding_revenue)}</Typography>
                    <Typography>Overdue: {money(data.revenue.overdue_revenue)}</Typography>
                    <Typography>Payments: {data.payments.completed} completed</Typography>
                  </Stack>
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard title="Client metrics">
                  <List dense disablePadding>
                    {data.clients.top_clients.slice(0, 6).map((client) => (
                      <ListItem key={client.client} disableGutters divider>
                        <ListItemText primary={client.client} secondary={money(client.revenue)} />
                      </ListItem>
                    ))}
                  </List>
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard title="Team workload">
                  <List dense disablePadding>
                    {data.projects.team_workload.slice(0, 6).map((member) => (
                      <ListItem key={member.assigned_to__email ?? 'unassigned'} disableGutters divider>
                        <ListItemText primary={member.assigned_to__email ?? 'Unassigned'} secondary={`${member.open_tasks} open tasks`} />
                      </ListItem>
                    ))}
                  </List>
                </AppCard>
              </Grid>
            </Grid>
          </>
        ) : null}
      </QueryState>
    </Stack>
  );
};

export default ExecutiveDashboardPage;
