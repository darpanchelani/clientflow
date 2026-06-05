import React from 'react';
import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';

import { AIPrediction, PaymentRiskResponse } from '../../types/ai';
import InsightSeverityChip from './InsightSeverityChip';

interface PaymentRiskCardProps {
  risk?: PaymentRiskResponse;
  prediction?: AIPrediction;
}

const riskLevelFromScore = (score: number) => {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const PaymentRiskCard = ({ risk, prediction }: PaymentRiskCardProps) => {
  const score = risk?.risk_score ?? Number(prediction?.score ?? 0);
  const riskLevel = risk?.risk_level ?? riskLevelFromScore(score);
  const invoiceNumber = String(
    risk?.features?.invoice_number ?? prediction?.result?.invoice_number ?? `Invoice #${prediction?.entity_id ?? 'unknown'}`
  );
  const recommendation = risk?.recommendation ?? prediction?.explanation ?? 'Review payment status and follow up if needed.';

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={800}>
              {invoiceNumber}
            </Typography>
            <InsightSeverityChip severity={riskLevel === 'high' ? 'critical' : riskLevel} />
          </Stack>
          <Typography variant="h5" fontWeight={800}>
            {score}
          </Typography>
          <LinearProgress variant="determinate" value={Math.min(score, 100)} sx={{ height: 8, borderRadius: 4 }} />
          {risk?.delay_probability !== undefined ? (
            <Typography variant="body2" color="text.secondary">
              Delay probability: {Math.round(risk.delay_probability * 100)}%
            </Typography>
          ) : null}
          <Typography variant="body2">{recommendation}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PaymentRiskCard;
