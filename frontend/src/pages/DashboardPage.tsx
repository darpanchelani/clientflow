import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import QueryState from '../components/common/QueryState';
import KpiCard from '../components/dashboard/KpiCard';
import LeadFunnelChart from '../components/dashboard/LeadFunnelChart';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useDashboardQuery } from '../hooks/useDashboard';
import { getFriendlyErrorMessage } from '../utils/apiError';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);

const DashboardPage = () => {
  const query = useDashboardQuery();
  const stats = query.data;

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Dashboard"
        description="Overview of pipeline health, billing, and delivery across your workspace."
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={getFriendlyErrorMessage(query.error)}
        onRetry={() => query.refetch()}
        skeleton="dashboard"
      >
        {stats ? (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard label="Total leads" value={stats.totalLeads} hint="Active pipeline" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Clients"
                  value={stats.totalClients}
                  hint="Managed accounts"
                  accent="secondary.main"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Active projects"
                  value={stats.activeProjects}
                  hint="In delivery"
                  accent="#7c3aed"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Open invoices"
                  value={stats.openInvoices}
                  hint={`${stats.paidInvoices} paid`}
                  accent="#ea580c"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <AppCard title="Lead funnel" subtitle="Distribution by pipeline stage">
                  <LeadFunnelChart funnel={stats.leadFunnel} />
                </AppCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <AppCard
                  title="Payment metrics"
                  subtitle="Completed payments"
                  action={
                    <Button component={RouterLink} to="/payments" size="small" endIcon={<ArrowForwardIcon />}>
                      View all
                    </Button>
                  }
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="secondary.main">
                        {formatCurrency(stats.paymentTotal)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Collected revenue
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {stats.paidInvoices} invoices marked paid
                    </Typography>
                  </Stack>
                </AppCard>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <AppCard
                  title="Recent activity"
                  subtitle="Latest lead updates"
                  action={
                    <Button component={RouterLink} to="/leads" size="small">
                      Leads
                    </Button>
                  }
                >
                  {stats.recentLeads.length === 0 ? (
                    <Typography color="text.secondary">No recent lead activity.</Typography>
                  ) : (
                    <List dense disablePadding>
                      {stats.recentLeads.map((lead) => (
                        <ListItem key={lead.id} disableGutters divider>
                          <ListItemText
                            primary={lead.name}
                            secondary={`${lead.company || 'No company'} · ${new Date(lead.updated_at).toLocaleString()}`}
                          />
                          <Chip size="small" label={lead.status} sx={{ textTransform: 'capitalize' }} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </AppCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <AppCard
                  title="Overdue invoices"
                  subtitle="Requires follow-up"
                  action={
                    <Button component={RouterLink} to="/invoices" size="small">
                      Invoices
                    </Button>
                  }
                >
                  {stats.overdueInvoices.length === 0 ? (
                    <Typography color="text.secondary">No overdue invoices. Great work.</Typography>
                  ) : (
                    <List dense disablePadding>
                      {stats.overdueInvoices.slice(0, 6).map((invoice) => (
                        <ListItem
                          key={invoice.id}
                          disableGutters
                          divider
                          component={RouterLink}
                          to={`/invoices/${invoice.id}`}
                          sx={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <WarningAmberIcon color="warning" sx={{ mr: 1.5, fontSize: 20 }} />
                          <ListItemText
                            primary={invoice.invoice_number}
                            secondary={`Due ${invoice.due_date} · ${invoice.total}`}
                          />
                          <Chip size="small" color="warning" label={invoice.status} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </AppCard>
              </Grid>
            </Grid>

            <AppCard
              title="Quick actions"
              subtitle="Jump to common workflows"
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                <Button component={RouterLink} to="/leads" variant="outlined">
                  Add lead
                </Button>
                <Button component={RouterLink} to="/clients" variant="outlined">
                  Add client
                </Button>
                <Button component={RouterLink} to="/projects" variant="outlined">
                  New project
                </Button>
                <Button component={RouterLink} to="/invoices" variant="contained">
                  Create invoice
                </Button>
              </Stack>
            </AppCard>
          </>
        ) : null}
      </QueryState>
    </Stack>
  );
};

export default DashboardPage;
