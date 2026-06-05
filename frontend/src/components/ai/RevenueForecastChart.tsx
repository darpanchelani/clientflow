import React from 'react';
import { Box, Chip, Grid, Stack, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import AppCard from '../common/AppCard';
import AIEmptyState from './AIEmptyState';
import AILoadingState from './AILoadingState';
import { RevenueForecastResponse } from '../../types/ai';

interface RevenueForecastChartProps {
  forecast?: RevenueForecastResponse;
  isLoading?: boolean;
}

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));

const RevenueForecastChart = ({ forecast, isLoading }: RevenueForecastChartProps) => {
  if (isLoading) return <AILoadingState cards={1} />;
  if (!forecast) {
    return (
      <AIEmptyState
        title="No revenue forecast yet"
        description="Revenue forecasting appears after invoices and payments are available."
      />
    );
  }

  const data = [
    { label: 'Previous', value: Number(forecast.previous_month_revenue) },
    { label: 'Current', value: Number(forecast.current_month_revenue) },
    { label: 'Projected', value: Number(forecast.projected_monthly_revenue) },
    { label: 'Quarterly', value: Number(forecast.quarterly_forecast) },
  ];

  return (
    <AppCard
      title="Revenue forecast"
      subtitle="Projected from paid revenue, outstanding invoices, and overdue risk adjustment."
      action={<Chip label={forecast.trend_direction} color={forecast.trend_direction === 'up' ? 'success' : forecast.trend_direction === 'down' ? 'warning' : 'default'} sx={{ textTransform: 'capitalize' }} />}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Stack spacing={1.5}>
            <Metric label="Current month" value={formatCurrency(forecast.current_month_revenue)} />
            <Metric label="Projected monthly" value={formatCurrency(forecast.projected_monthly_revenue)} />
            <Metric label="Quarterly forecast" value={formatCurrency(forecast.quarterly_forecast)} />
            <Metric label="Outstanding expected" value={formatCurrency(forecast.outstanding_expected_revenue)} />
            <Metric label="Overdue risk adjustment" value={formatCurrency(forecast.overdue_risk_adjustment)} />
          </Stack>
        </Grid>
      </Grid>
    </AppCard>
  );
};

interface MetricProps {
  label: string;
  value: string;
}

const Metric = ({ label, value }: MetricProps) => (
  <Box>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800}>
      {value}
    </Typography>
  </Box>
);

export default RevenueForecastChart;
