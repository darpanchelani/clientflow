import api from './api';
import {
  AIReport,
  AIReportConfiguration,
  AnalyticsDashboard,
  AnalyticsFilters,
  GenerateAIReportPayload,
  PaginatedAIReports,
} from '../types/analytics';

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
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getAIReports = async () => {
  const response = await api.get<PaginatedAIReports>('/ai/reports/');
  return response.data;
};

export const getAIReportConfiguration = async () => {
  const response = await api.get<AIReportConfiguration>('/ai/reports/configuration/');
  return response.data;
};

export const generateAIReport = async (payload: GenerateAIReportPayload) => {
  const response = await api.post<AIReport>('/ai/reports/generate/', payload);
  return response.data;
};

export const deleteAIReport = async (id: number) => {
  await api.delete(`/ai/reports/${id}/`);
  return id;
};

export const downloadAIReport = async (report: AIReport) => {
  const response = await api.get<Blob>(`/ai/reports/${report.id}/download/`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clientflow-ai-report-${report.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
