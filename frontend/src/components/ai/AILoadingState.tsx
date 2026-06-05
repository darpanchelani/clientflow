import React from 'react';
import { Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

interface AILoadingStateProps {
  cards?: number;
}

const AILoadingState = ({ cards = 3 }: AILoadingStateProps) => (
  <Grid container spacing={2}>
    {Array.from({ length: cards }).map((_, index) => (
      <Grid item xs={12} md={4} key={index}>
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Skeleton width="45%" />
              <Skeleton height={42} />
              <Skeleton width="80%" />
              <Skeleton width="65%" />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default AILoadingState;
