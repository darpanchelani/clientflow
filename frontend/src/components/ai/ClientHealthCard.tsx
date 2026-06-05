import React from 'react';
import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';

import { ClientHealthResponse } from '../../types/ai';
import InsightSeverityChip from './InsightSeverityChip';

interface ClientHealthCardProps {
  health: ClientHealthResponse;
}

const ClientHealthCard = ({ health }: ClientHealthCardProps) => {
  const clientName = `Client #${health.features.client_id ?? health.prediction_id}`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={800}>
              {clientName}
            </Typography>
            <InsightSeverityChip severity={health.risk_level === 'high' ? 'critical' : health.risk_level} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Health score
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {health.health_score}
          </Typography>
          <LinearProgress variant="determinate" value={Math.min(health.health_score, 100)} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" color="text.secondary">
            Churn score: {health.churn_score}
          </Typography>
          <Typography variant="body2">{health.retention_recommendation}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ClientHealthCard;
