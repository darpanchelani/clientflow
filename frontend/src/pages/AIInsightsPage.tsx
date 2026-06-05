import React, { useMemo, useState } from 'react';
import { Alert, Button, Grid, Stack, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import AIRecommendationCard from '../components/ai/AIRecommendationCard';
import AISummaryCards from '../components/ai/AISummaryCards';
import BusinessInsightsPanel from '../components/ai/BusinessInsightsPanel';
import ClientHealthCard from '../components/ai/ClientHealthCard';
import PaymentRiskCard from '../components/ai/PaymentRiskCard';
import RevenueForecastChart from '../components/ai/RevenueForecastChart';
import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import {
  useAIInsights,
  useClientHealth,
  useDeleteInsightMutation,
  useGenerateInsightsMutation,
  useMarkAllInsightsReadMutation,
  useMarkInsightReadMutation,
  usePaymentRisks,
  useRevenueForecast,
} from '../hooks/useAI';
import { AIInsightFilters, AIRecommendation } from '../types/ai';
import { getFriendlyErrorMessage } from '../utils/apiError';

const AIInsightsPage = () => {
  const [filters, setFilters] = useState<AIInsightFilters>({});
  const insightsQuery = useAIInsights(filters);
  const paymentRisksQuery = usePaymentRisks({});
  const clientHealthQuery = useClientHealth({});
  const forecastQuery = useRevenueForecast({});
  const generateInsightsMutation = useGenerateInsightsMutation();
  const markReadMutation = useMarkInsightReadMutation();
  const markAllReadMutation = useMarkAllInsightsReadMutation();
  const deleteInsightMutation = useDeleteInsightMutation();

  const insights = useMemo(() => insightsQuery.data?.results ?? [], [insightsQuery.data?.results]);
  const paymentRisks = paymentRisksQuery.data ?? [];
  const highPaymentRisks = paymentRisks.filter((risk) => Number(risk.score ?? 0) >= 70).slice(0, 3);
  const atRiskClients = (clientHealthQuery.data?.results ?? [])
    .filter((client) => client.risk_level !== 'low')
    .slice(0, 3);

  const recommendations = useMemo<AIRecommendation[]>(
    () =>
      insights
        .filter((insight) => insight.recommendation)
        .slice(0, 4)
        .map((insight) => ({
          id: insight.id,
          title: insight.title,
          recommendation: insight.recommendation,
          category: insight.category,
          severity: insight.severity,
        })),
    [insights]
  );

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="AI Insights"
        description="Intelligent recommendations based on your CRM, projects, invoices, and activity data."
        actions={
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isLoading}
          >
            {generateInsightsMutation.isLoading ? 'Generating...' : 'Generate Latest Insights'}
          </Button>
        }
      />

      {generateInsightsMutation.isError ? (
        <Alert severity="error">{getFriendlyErrorMessage(generateInsightsMutation.error)}</Alert>
      ) : null}
      {generateInsightsMutation.isSuccess ? (
        <Alert severity="success">
          Generated {generateInsightsMutation.data?.created_count ?? 0} new insights from current business data.
        </Alert>
      ) : null}

      <AISummaryCards
        insights={insights}
        paymentRisks={paymentRisks}
        clientHealth={clientHealthQuery.data}
        forecast={forecastQuery.data}
        isLoading={insightsQuery.isLoading || paymentRisksQuery.isLoading || clientHealthQuery.isLoading || forecastQuery.isLoading}
      />

      <RevenueForecastChart forecast={forecastQuery.data} isLoading={forecastQuery.isLoading} />
      {forecastQuery.isError ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => forecastQuery.refetch()}>Retry</Button>}>
          {getFriendlyErrorMessage(forecastQuery.error, 'Unable to load revenue forecast.')}
        </Alert>
      ) : null}

      <BusinessInsightsPanel
        insights={insights}
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={insightsQuery.isLoading}
        isError={insightsQuery.isError}
        error={insightsQuery.error}
        onRetry={() => insightsQuery.refetch()}
        onGenerate={() => generateInsightsMutation.mutate()}
        isGenerating={generateInsightsMutation.isLoading}
        onMarkRead={(id) => markReadMutation.mutate(id)}
        onDelete={(id) => deleteInsightMutation.mutate(id)}
        onMarkAllRead={() => markAllReadMutation.mutate()}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={6}>
          <AppCard title="Payment risk overview" subtitle="High-risk invoice predictions from stored AI payment risk scores.">
            <Stack spacing={2}>
              {paymentRisksQuery.isError ? (
                <Alert severity="error">{getFriendlyErrorMessage(paymentRisksQuery.error)}</Alert>
              ) : null}
              {highPaymentRisks.length === 0 ? (
                <Typography color="text.secondary">No high payment risk predictions available yet.</Typography>
              ) : (
                highPaymentRisks.map((risk) => <PaymentRiskCard key={risk.id} prediction={risk} />)
              )}
            </Stack>
          </AppCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <AppCard title="Client health overview" subtitle="Clients with churn or retention signals.">
            <Stack spacing={2}>
              {clientHealthQuery.isError ? (
                <Alert severity="error">{getFriendlyErrorMessage(clientHealthQuery.error)}</Alert>
              ) : null}
              {atRiskClients.length === 0 ? (
                <Typography color="text.secondary">No at-risk client health signals available yet.</Typography>
              ) : (
                atRiskClients.map((health) => <ClientHealthCard key={health.prediction_id} health={health} />)
              )}
            </Stack>
          </AppCard>
        </Grid>
      </Grid>

      <AppCard title="Recommended actions" subtitle="Highest-priority next steps generated from AI insights.">
        {recommendations.length === 0 ? (
          <Typography color="text.secondary">Generate insights to see recommended actions.</Typography>
        ) : (
          <Grid container spacing={2}>
            {recommendations.map((recommendation) => (
              <Grid item xs={12} md={6} key={recommendation.id}>
                <AIRecommendationCard {...recommendation} />
              </Grid>
            ))}
          </Grid>
        )}
      </AppCard>

    </Stack>
  );
};

export default AIInsightsPage;
