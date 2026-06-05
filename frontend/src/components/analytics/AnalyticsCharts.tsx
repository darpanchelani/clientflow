import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = ['#1e4fd6', '#0f9d8a', '#ea580c', '#dc2626', '#7c3aed', '#64748b'];

export const RevenueTrendChart = ({ data }: { data: Array<{ month: string; total: string }> }) => (
  <ResponsiveContainer width="100%" height={280}>
    <LineChart data={data.map((item) => ({ ...item, total: Number(item.total) }))}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="total" stroke="#1e4fd6" strokeWidth={3} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

export const CountBarChart = ({ data, labelKey = 'status', valueKey = 'count' }: { data: any[]; labelKey?: string; valueKey?: string }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={labelKey} />
      <YAxis />
      <Tooltip />
      <Bar dataKey={valueKey} fill="#0f9d8a" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const BreakdownPieChart = ({ data, nameKey = 'status', valueKey = 'count' }: { data: any[]; nameKey?: string; valueKey?: string }) => (
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={54} outerRadius={90} paddingAngle={2}>
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);
