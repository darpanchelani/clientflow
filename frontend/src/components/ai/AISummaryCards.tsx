import React from 'react';
import { Grid } from '@mui/material';
import KpiCard from '../dashboard/KpiCard';
import { AIInsight, AIPrediction, ClientHealthListResponse, RevenueForecastResponse } from '../../types/ai';

interface AISummaryCardsProps {
  insights?: AIInsight[];
  paymentRisks?: AIPrediction[];
  clientHealth?: ClientHealthListResponse;
  forecast?: RevenueForecastResponse;
  isLoading?: boolean;
}

const trendLabel = (trend?: string) => {
  if (!trend) return 'No forecast yet';
  if (trend === 'up') return 'Trending up';
  if (trend === 'down') return 'Trending down';
  return 'Flat trend';
};

const AISummaryCards = ({ insights = [], paymentRisks = [], clientHealth, forecast, isLoading }: AISummaryCardsProps) => {
  const criticalCount = insights.filter((item) => item.severity === 'critical').length;
  const highPaymentRiskCount = paymentRisks.filter((item) => Number(item.score ?? 0) >= 70).length;
  const atRiskClients = clientHealth?.results.filter((client) => client.risk_level === 'high').length ?? 0;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Critical alerts"
          value={isLoading ? '...' : criticalCount}
          hint="Needs immediate action"
          accent="#dc2626"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Payment risks"
          value={isLoading ? '...' : highPaymentRiskCount}
          hint="High risk invoices"
          accent="#ea580c"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Client health risks"
          value={isLoading ? '...' : atRiskClients}
          hint="High churn risk"
          accent="#7c3aed"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <KpiCard
          label="Revenue forecast"
          value={isLoading ? '...' : trendLabel(forecast?.trend_direction)}
          hint={forecast ? `$${Number(forecast.projected_monthly_revenue).toLocaleString()} projected` : 'Generate billing data'}
          accent="#0f9d8a"
        />
      </Grid>
    </Grid>
  );
};

export default AISummaryCards;
