import React from 'react';
import { Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';

interface LeadScoreBadgeProps {
  score?: number | null;
  probability?: number | null;
  priority?: 'low' | 'medium' | 'high' | string | null;
  recommendation?: string;
  loading?: boolean;
}

const getColor = (score?: number | null): 'success' | 'warning' | 'default' => {
  if (score === undefined || score === null) return 'default';
  if (score >= 75) return 'success';
  if (score >= 40) return 'warning';
  return 'default';
};

const priorityLabel = (priority?: string | null) => {
  if (priority === 'high') return 'High Priority';
  if (priority === 'medium') return 'Medium Priority';
  if (priority === 'low') return 'Low Priority';
  return 'Not scored';
};

const LeadScoreBadge = ({ score, probability, priority, recommendation, loading }: LeadScoreBadgeProps) => {
  if (loading) {
    return (
      <Stack spacing={0.5} sx={{ minWidth: 120 }}>
        <LinearProgress />
        <Typography variant="caption" color="text.secondary">Scoring...</Typography>
      </Stack>
    );
  }

  if (score === undefined || score === null) {
    return <Chip size="small" variant="outlined" label="Not scored" />;
  }

  return (
    <Tooltip title={recommendation || 'AI conversion score'}>
      <Stack spacing={0.5} alignItems="flex-start">
        <Chip size="small" color={getColor(score)} label={`${score}/100`} />
        <Typography variant="caption" color="text.secondary">
          {priorityLabel(priority)}{probability !== undefined && probability !== null ? ` | ${Math.round(probability * 100)}%` : ''}
        </Typography>
      </Stack>
    </Tooltip>
  );
};

export default LeadScoreBadge;
