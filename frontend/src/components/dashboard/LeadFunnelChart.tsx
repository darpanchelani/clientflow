import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LeadFunnelChartProps {
  funnel: Record<string, number>;
}

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

const LeadFunnelChart = ({ funnel }: LeadFunnelChartProps) => {
  const data = Object.entries(funnel).map(([status, count]) => ({
    status: statusLabels[status] ?? status,
    count,
  }));

  if (data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No lead data yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 280 }} role="img" aria-label="Lead funnel chart">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="status" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#1e4fd6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LeadFunnelChart;
