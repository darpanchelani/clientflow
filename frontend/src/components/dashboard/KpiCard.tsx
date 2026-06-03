import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}

const KpiCard = ({ label, value, hint, accent = 'primary.main' }: KpiCardProps) => (
  <Paper sx={{ p: 2.5, height: '100%' }}>
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color: accent }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
      <Box sx={{ mt: 'auto', height: 4, borderRadius: 2, bgcolor: accent, opacity: 0.35, width: 48 }} />
    </Stack>
  </Paper>
);

export default KpiCard;
