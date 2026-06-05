import React from 'react';
import { Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';

interface ClientHealthBadgeProps {
  healthScore?: number | null;
  churnScore?: number | null;
  riskLevel?: 'low' | 'medium' | 'high' | string | null;
  recommendation?: string;
  loading?: boolean;
}

const labelForRisk = (riskLevel?: string | null) => {
  if (riskLevel === 'high') return 'At Risk';
  if (riskLevel === 'medium') return 'Watch';
  if (riskLevel === 'low') return 'Healthy';
  return 'No health data yet';
};

const colorForRisk = (riskLevel?: string | null): 'success' | 'warning' | 'error' | 'default' => {
  if (riskLevel === 'high') return 'error';
  if (riskLevel === 'medium') return 'warning';
  if (riskLevel === 'low') return 'success';
  return 'default';
};

const ClientHealthBadge = ({ healthScore, churnScore, riskLevel, recommendation, loading }: ClientHealthBadgeProps) => {
  if (loading) {
    return (
      <Stack spacing={0.5} sx={{ minWidth: 120 }}>
        <LinearProgress />
        <Typography variant="caption" color="text.secondary">Loading health...</Typography>
      </Stack>
    );
  }

  if (healthScore === undefined || healthScore === null) {
    return <Chip size="small" variant="outlined" label="No health data yet" />;
  }

  return (
    <Tooltip title={recommendation || 'AI client health'}>
      <Stack spacing={0.5} alignItems="flex-start">
        <Chip size="small" color={colorForRisk(riskLevel)} label={`${labelForRisk(riskLevel)} ${healthScore}/100`} />
        {churnScore !== undefined && churnScore !== null ? (
          <Typography variant="caption" color="text.secondary">{churnScore}/100 churn risk</Typography>
        ) : null}
      </Stack>
    </Tooltip>
  );
};

export default ClientHealthBadge;
