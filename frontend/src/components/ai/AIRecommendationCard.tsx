import React from 'react';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { AICategory, AISeverity } from '../../types/ai';
import InsightSeverityChip from './InsightSeverityChip';

interface AIRecommendationCardProps {
  title: string;
  recommendation: string;
  category: AICategory | string;
  severity: AISeverity | string;
  actionLabel?: string;
  onAction?: () => void;
}

const AIRecommendationCard = ({
  title,
  recommendation,
  category,
  severity,
  actionLabel,
  onAction,
}: AIRecommendationCardProps) => (
  <Card variant="outlined">
    <CardContent>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <InsightSeverityChip severity={severity} />
          <Chip size="small" label={category} sx={{ textTransform: 'capitalize' }} />
        </Stack>
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {recommendation}
        </Typography>
        {actionLabel && onAction ? (
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={onAction} sx={{ alignSelf: 'flex-start' }}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </CardContent>
  </Card>
);

export default AIRecommendationCard;
