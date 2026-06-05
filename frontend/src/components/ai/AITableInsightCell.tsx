import React from 'react';
import { Stack, Typography } from '@mui/material';

interface AITableInsightCellProps {
  badge: React.ReactNode;
  recommendation?: string;
}

const AITableInsightCell = ({ badge, recommendation }: AITableInsightCellProps) => (
  <Stack spacing={0.5} sx={{ minWidth: 140 }}>
    {badge}
    {recommendation ? (
      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
        {recommendation.length > 72 ? `${recommendation.slice(0, 72)}...` : recommendation}
      </Typography>
    ) : null}
  </Stack>
);

export default AITableInsightCell;
