import React, { useState } from 'react';
import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';

import AnalyticsFilterBar from '../components/analytics/AnalyticsFilterBar';
import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import { useClientsQuery } from '../hooks/useClients';
import { useProjectsQuery } from '../hooks/useProjects';
import { useUsersQuery } from '../hooks/useUsers';
import { downloadReport } from '../services/analyticsApi';
import { AnalyticsFilters } from '../types/analytics';

const ReportsPage = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({ range: 'last_30_days' });
  const [reportType, setReportType] = useState('revenue');
  const [format, setFormat] = useState('csv');
  const [isDownloading, setIsDownloading] = useState(false);
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});
  const usersQuery = useUsersQuery();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadReport({ ...filters, type: reportType, format });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader title="Reports" description="Generate revenue, client, project, and invoice exports." />
      <AppCard title="Report filters">
        <Stack spacing={2}>
          <AnalyticsFilterBar filters={filters} onChange={setFilters} clients={clientsQuery.data?.results ?? []} projects={projectsQuery.data?.results ?? []} users={usersQuery.data ?? []} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Report" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                <MenuItem value="revenue">Revenue report</MenuItem>
                <MenuItem value="clients">Client report</MenuItem>
                <MenuItem value="projects">Project report</MenuItem>
                <MenuItem value="invoices">Invoice report</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Format" value={format} onChange={(event) => setFormat(event.target.value)}>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth size="large" variant="contained" onClick={handleDownload} disabled={isDownloading} sx={{ height: '100%' }}>
                {isDownloading ? 'Preparing...' : 'Download report'}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </AppCard>
    </Stack>
  );
};

export default ReportsPage;
