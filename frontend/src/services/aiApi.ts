import api from './api';
import {
  AIInsight,
  AIInsightFilters,
  AIPrediction,
  AIPredictionFilters,
  AIProposalFilters,
  BulkLeadScoreResponse,
  ClientHealthListResponse,
  ClientHealthResponse,
  GenerateProposalPayload,
  GenerateProposalResponse,
  LeadScoreResponse,
  PaginatedResponse,
  PaymentRiskResponse,
  ProposalDraft,
  ProposalSendPayload,
  RevenueForecastResponse,
} from '../types/ai';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

const cleanParams = (params: object = {}) => {
  const next: Record<string, string | number | boolean> = {};
  Object.entries(params as Record<string, QueryValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      next[key] = value;
    }
  });
  return next;
};

export const getLeadScore = async (leadId: number) => {
  const response = await api.get<LeadScoreResponse>(`/ai/leads/${leadId}/score/`);
  return response.data;
};

export const bulkScoreLeads = async (payload: { lead_ids?: number[] } = {}) => {
  const response = await api.post<BulkLeadScoreResponse>('/ai/leads/bulk-score/', payload);
  return response.data;
};

export const getPaymentRisk = async (invoiceId: number) => {
  const response = await api.get<PaymentRiskResponse>(`/ai/invoices/${invoiceId}/payment-risk/`);
  return response.data;
};

export const getPaymentRisks = async (filters: AIPredictionFilters = {}) => {
  const response = await api.get<AIPrediction[]>('/ai/payment-risks/', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getClientChurnRisk = async (clientId: number) => {
  const response = await api.get<ClientHealthResponse>(`/ai/clients/${clientId}/churn-risk/`);
  return response.data;
};

export const getClientHealth = async (filters: QueryParams = {}) => {
  const response = await api.get<ClientHealthListResponse>('/ai/clients/health/', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getRevenueForecast = async (filters: QueryParams = {}) => {
  const response = await api.get<RevenueForecastResponse>('/ai/revenue/forecast/', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getInsights = async (filters: AIInsightFilters = {}) => {
  const response = await api.get<PaginatedResponse<AIInsight>>('/ai/insights/', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const generateInsights = async () => {
  const response = await api.post<{ created_count: number; count: number; results: AIInsight[] }>(
    '/ai/insights/generate/',
    {}
  );
  return response.data;
};

export const markInsightRead = async (id: number) => {
  const response = await api.patch<AIInsight>(`/ai/insights/${id}/read/`);
  return response.data;
};

export const markAllInsightsRead = async () => {
  const response = await api.patch<{ updated: number }>('/ai/insights/mark-all-read/');
  return response.data;
};

export const deleteInsight = async (id: number) => {
  await api.delete(`/ai/insights/${id}/`);
  return id;
};

export const generateProposal = async (payload: GenerateProposalPayload) => {
  const response = await api.post<GenerateProposalResponse>('/ai/proposals/generate/', payload);
  return response.data;
};

export const getProposals = async (filters: AIProposalFilters = {}) => {
  const response = await api.get<PaginatedResponse<ProposalDraft>>('/ai/proposals/', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getProposal = async (id: number) => {
  const response = await api.get<ProposalDraft>(`/ai/proposals/${id}/`);
  return response.data;
};

export const updateProposal = async (id: number, payload: Partial<ProposalDraft>) => {
  const response = await api.patch<ProposalDraft>(`/ai/proposals/${id}/`, payload);
  return response.data;
};

export const deleteProposal = async (id: number) => {
  await api.delete(`/ai/proposals/${id}/`);
  return id;
};

export const approveProposal = async (id: number) => {
  const response = await api.post<ProposalDraft>(`/ai/proposals/${id}/approve/`);
  return response.data;
};

export const archiveProposal = async (id: number) => {
  const response = await api.post<ProposalDraft>(`/ai/proposals/${id}/archive/`);
  return response.data;
};

export const downloadProposalPdf = async (id: number) => {
  const response = await api.get<Blob>(`/ai/proposals/${id}/download/`, {
    responseType: 'blob',
  });
  return response.data;
};

export const sendProposal = async (id: number, payload: ProposalSendPayload) => {
  const response = await api.post<ProposalDraft>(`/ai/proposals/${id}/send/`, payload);
  return response.data;
};
