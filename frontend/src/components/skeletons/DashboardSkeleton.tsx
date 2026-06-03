import React from 'react';
import { Grid, Paper, Skeleton, Stack } from '@mui/material';

import CardSkeleton from './CardSkeleton';

const DashboardSkeleton = () => (
  <Stack spacing={3} aria-busy="true" aria-label="Loading dashboard">
    <Skeleton variant="text" width={280} height={48} />
    <CardSkeleton count={4} />
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: 320 }}>
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="rounded" height={240} sx={{ mt: 2 }} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: 320 }}>
          <Skeleton variant="text" width="50%" />
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={36} />
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  </Stack>
);

export default DashboardSkeleton;
