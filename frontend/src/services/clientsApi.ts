import api from './api';
import {
  Client,
  ClientFilters,
  ClientFormValues,
  PaginatedResponse,
} from '../types/crm';

const cleanParams = (params: ClientFilters) => {
  const next: Record<string, string> = {};
  if (params.search) next.search = params.search;
  if (params.status) next.status = params.status;
  if (params.cursor) next.cursor = params.cursor;
  return next;
};

export const listClients = async (params: ClientFilters = {}) => {
  const response = await api.get<PaginatedResponse<Client>>('/clients/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const createClient = async (payload: ClientFormValues) => {
  const response = await api.post<Client>('/clients/', payload);
  return response.data;
};

export const updateClient = async (id: number, payload: Partial<ClientFormValues>) => {
  const response = await api.put<Client>(`/clients/${id}/`, payload);
  return response.data;
};

export const deleteClient = async (id: number) => {
  await api.delete(`/clients/${id}/`);
  return id;
};

