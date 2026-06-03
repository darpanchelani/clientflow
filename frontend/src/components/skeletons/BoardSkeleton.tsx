import React from 'react';
import { Grid, Paper, Skeleton, Stack } from '@mui/material';

const BoardSkeleton = () => (
  <Grid container spacing={2} aria-busy="true" aria-label="Loading board">
    {Array.from({ length: 4 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Paper sx={{ p: 2, minHeight: 280 }}>
          <Skeleton variant="text" width="50%" />
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={72} />
            <Skeleton variant="rounded" height={72} />
          </Stack>
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export default BoardSkeleton;
