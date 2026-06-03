import React from 'react';
import { Grid, Paper } from '@mui/material';

interface FilterBarProps {
  children: React.ReactNode;
}

const FilterBar = ({ children }: FilterBarProps) => (
  <Paper sx={{ p: 2 }} component="section" aria-label="Filters">
    <Grid container spacing={2} alignItems="center">
      {children}
    </Grid>
  </Paper>
);

export default FilterBar;
