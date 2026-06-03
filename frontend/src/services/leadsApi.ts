import api from './api';
import {
  Lead,
  LeadFilters,
  LeadFormValues,
  PaginatedResponse,
} from '../types/crm';

const cleanParams = (params: LeadFilters) => {
  const next: Record<string, string> = {};
  if (params.search) next.search = params.search;
  if (params.status) next.status = params.status;
  if (params.source) next.source = params.source;
  if (params.cursor) next.cursor = params.cursor;
  return next;
};

export const listLeads = async (params: LeadFilters = {}) => {
  const response = await api.get<PaginatedResponse<Lead>>('/leads/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const createLead = async (payload: LeadFormValues) => {
  const response = await api.post<Lead>('/leads/', payload);
  return response.data;
};

export const updateLead = async (id: number, payload: Partial<LeadFormValues>) => {
  const response = await api.put<Lead>(`/leads/${id}/`, payload);
  return response.data;
};

export const deleteLead = async (id: number) => {
  await api.delete(`/leads/${id}/`);
  return id;
};

export const updateLeadStatus = async (id: number, status: string) => {
  const response = await api.patch<Lead>(`/leads/${id}/status/`, { status });
  return response.data;
};

