import React from 'react';
import { Grid, Paper, Skeleton } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
}

const CardSkeleton = ({ count = 4 }: CardSkeletonProps) => (
  <Grid container spacing={2} aria-busy="true" aria-label="Loading cards">
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Paper sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="rounded" height={12} sx={{ mt: 2 }} />
        </Paper>
      </Grid>
    ))}
  </Grid>
);

export default CardSkeleton;
