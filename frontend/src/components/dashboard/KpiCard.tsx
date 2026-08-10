import React from 'react';
import { Paper, Stack, Typography } from '@mui/material';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}

const KpiCard = ({ label, value, hint, accent = 'primary.main' }: KpiCardProps) => (
  <Paper variant="outlined" sx={{ p: 2.25, height: '100%' }}>
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary" fontWeight={650}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
);

export default KpiCard;
