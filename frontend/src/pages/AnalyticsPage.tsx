import React, { useState } from 'react';
import { Grid, Stack } from '@mui/material';

import AnalyticsFilterBar from '../components/analytics/AnalyticsFilterBar';
import { BreakdownPieChart, CountBarChart, RevenueTrendChart } from '../components/analytics/AnalyticsCharts';
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

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value));

const AnalyticsPage = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({ range: 'last_30_days' });
  const query = useAnalyticsDashboardQuery(filters);
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});
  const usersQuery = useUsersQuery();
  const data = query.data;

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Analytics"
        description="Business performance across revenue, pipeline, delivery, and client growth."
        actions={
          <AnalyticsFilterBar
            filters={filters}
            onChange={setFilters}
            clients={clientsQuery.data?.results ?? []}
            projects={projectsQuery.data?.results ?? []}
            users={usersQuery.data ?? []}
          />
        }
      />
      <QueryState isLoading={query.isLoading} isError={query.isError} errorMessage={getFriendlyErrorMessage(query.error)} onRetry={() => query.refetch()} skeleton="dashboard">
        {data ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <KpiCard label="Revenue" value={formatCurrency(data.summary.total_revenue)} hint="Selected range" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <KpiCard label="Conversion" value={`${data.sales_funnel.conversion_rate}%`} hint="Lead to client" accent="#0f9d8a" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <KpiCard label="Active projects" value={data.summary.active_project_count} hint="In delivery" accent="#7c3aed" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <KpiCard label="Overdue invoices" value={data.invoices.overdue_count} hint={formatCurrency(data.summary.overdue_revenue)} accent="#dc2626" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <KpiCard label="Task progress" value={`${data.tasks.completion_rate}%`} hint={`${data.tasks.open} open`} accent="#ea580c" />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} lg={8}>
                <AppCard title="Revenue trends">
                  <RevenueTrendChart data={data.revenue.monthly_revenue} />
                </AppCard>
              </Grid>
              <Grid item xs={12} lg={4}>
                <AppCard title="Lead funnel">
                  <CountBarChart
                    data={[
                      { status: 'new', count: data.sales_funnel.new_leads },
                      { status: 'qualified', count: data.sales_funnel.qualified_leads },
                      { status: 'converted', count: data.sales_funnel.converted_leads },
                      { status: 'lost', count: data.sales_funnel.lost_leads },
                    ]}
                  />
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard title="Project status">
                  <BreakdownPieChart data={data.projects.status_breakdown} />
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard title="Invoice status">
                  <BreakdownPieChart data={data.invoices.status_breakdown} />
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard title="Task completion">
                  <CountBarChart data={data.tasks.completion_trends} labelKey="date" />
                </AppCard>
              </Grid>
              <Grid item xs={12}>
                <AppCard title="Client growth">
                  <CountBarChart data={data.clients.growth_trend} labelKey="date" />
                </AppCard>
              </Grid>
            </Grid>
          </>
        ) : null}
      </QueryState>
    </Stack>
  );
};

export default AnalyticsPage;
