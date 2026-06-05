import React from 'react';
import { Alert, AlertColor, Stack, Typography } from '@mui/material';

interface AIInlineRecommendationProps {
  title: string;
  recommendation?: string;
  severity?: string;
  compact?: boolean;
}

const severityMap: Record<string, AlertColor> = {
  critical: 'error',
  high: 'error',
  warning: 'warning',
  medium: 'warning',
  success: 'success',
  low: 'info',
  info: 'info',
};

const AIInlineRecommendation = ({ title, recommendation, severity = 'info', compact }: AIInlineRecommendationProps) => (
  <Alert severity={severityMap[severity] ?? 'info'} variant={compact ? 'outlined' : 'standard'}>
    <Stack spacing={0.25}>
      <Typography fontWeight={700}>{title}</Typography>
      {recommendation ? <Typography variant="body2">{recommendation}</Typography> : null}
    </Stack>
  </Alert>
);

export default AIInlineRecommendation;
