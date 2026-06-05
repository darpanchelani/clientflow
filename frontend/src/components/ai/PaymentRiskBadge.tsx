import React from 'react';
import { Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';

interface PaymentRiskBadgeProps {
  riskScore?: number | string | null;
  riskLevel?: 'low' | 'medium' | 'high' | string | null;
  delayProbability?: number | string | null;
  recommendation?: string;
  loading?: boolean;
}

const colorForRisk = (riskLevel?: string | null): 'success' | 'warning' | 'error' | 'default' => {
  if (riskLevel === 'high') return 'error';
  if (riskLevel === 'medium') return 'warning';
  if (riskLevel === 'low') return 'success';
  return 'default';
};

const PaymentRiskBadge = ({ riskScore, riskLevel, delayProbability, recommendation, loading }: PaymentRiskBadgeProps) => {
  if (loading) {
    return (
      <Stack spacing={0.5} sx={{ minWidth: 120 }}>
        <LinearProgress />
        <Typography variant="caption" color="text.secondary">Checking risk...</Typography>
      </Stack>
    );
  }

  if (riskScore === undefined || riskScore === null) {
    return <Chip size="small" variant="outlined" label="AI unavailable" />;
  }

  const probability = delayProbability === undefined || delayProbability === null || delayProbability === '' ? null : Number(delayProbability);

  return (
    <Tooltip title={recommendation || 'AI payment risk'}>
      <Stack spacing={0.5} alignItems="flex-start">
        <Chip
          size="small"
          color={colorForRisk(riskLevel)}
          label={`${riskLevel || 'risk'} ${Number(riskScore).toFixed(0)}`}
          sx={{ textTransform: 'capitalize' }}
        />
        {probability !== null ? (
          <Typography variant="caption" color="text.secondary">{Math.round(probability * 100)}% delay risk</Typography>
        ) : null}
      </Stack>
    </Tooltip>
  );
};

export default PaymentRiskBadge;
