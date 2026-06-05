import api from './api';
import { AnalyticsDashboard, AnalyticsFilters } from '../types/analytics';

const cleanParams = (params: AnalyticsFilters) => {
  const next: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value) next[key] = value;
  });
  return next;
};

export const getAnalyticsDashboard = async (params: AnalyticsFilters = {}) => {
  const response = await api.get<AnalyticsDashboard>('/analytics/dashboard/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const downloadReport = async (params: AnalyticsFilters & { type: string; format: string }) => {
  const response = await api.get<Blob>('/analytics/reports/export/', {
    params: cleanParams(params),
    responseType: 'blob',
  });
  const extension = params.format === 'xlsx' ? 'xlsx' : params.format === 'pdf' ? 'pdf' : 'csv';
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clientflow-${params.type}-report.${extension}`;
  link.click();
  window.URL.revokeObjectURL(url);
};
