import React from 'react';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';

import AppCard from '../common/AppCard';
import InsightSeverityChip from './InsightSeverityChip';
import { LeadScoreResponse } from '../../types/ai';

interface LeadScoreCardProps {
  title?: string;
  score?: LeadScoreResponse;
}

const LeadScoreCard = ({ title = 'Lead score', score }: LeadScoreCardProps) => {
  if (!score) {
    return (
      <AppCard title={title}>
        <Typography color="text.secondary">Select or score a lead to view AI conversion signals.</Typography>
      </AppCard>
    );
  }

  return (
    <AppCard title={title} subtitle={score.explanation}>
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight={800}>
            {score.score}
          </Typography>
          <InsightSeverityChip severity={score.priority === 'high' ? 'critical' : score.priority} />
        </Stack>
        <Box>
          <LinearProgress variant="determinate" value={score.score} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Conversion probability: {Math.round(score.conversion_probability * 100)}%
        </Typography>
        <Typography variant="body2">{score.recommendation}</Typography>
      </Stack>
    </AppCard>
  );
};

export default LeadScoreCard;
