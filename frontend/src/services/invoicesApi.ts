import api from './api';
import {
  Invoice,
  InvoiceFilters,
  InvoiceFormValues,
  PaginatedResponse,
  Payment,
} from '../types/billing';

const cleanParams = (params: InvoiceFilters) => {
  const next: Record<string, string> = {};
  if (params.search) next.search = params.search;
  if (params.status) next.status = params.status;
  if (params.client) next.client = params.client;
  if (params.project) next.project = params.project;
  if (params.issue_date_after) next.issue_date_after = params.issue_date_after;
  if (params.issue_date_before) next.issue_date_before = params.issue_date_before;
  if (params.due_date_after) next.due_date_after = params.due_date_after;
  if (params.due_date_before) next.due_date_before = params.due_date_before;
  if (params.cursor) next.cursor = params.cursor;
  return next;
};

export const listInvoices = async (params: InvoiceFilters = {}) => {
  const response = await api.get<PaginatedResponse<Invoice>>('/invoices/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const getInvoice = async (id: number) => {
  const response = await api.get<Invoice>(`/invoices/${id}/`);
  return response.data;
};

export const createInvoice = async (payload: InvoiceFormValues) => {
  const response = await api.post<Invoice>('/invoices/', payload);
  return response.data;
};

export const updateInvoice = async (id: number, payload: InvoiceFormValues) => {
  const response = await api.put<Invoice>(`/invoices/${id}/`, payload);
  return response.data;
};

export const deleteInvoice = async (id: number) => {
  await api.delete(`/invoices/${id}/`);
  return id;
};

export const sendInvoice = async (id: number) => {
  const response = await api.post<Invoice>(`/invoices/${id}/send/`, {});
  return response.data;
};

export const updateInvoiceStatus = async (id: number, status: Invoice['status']) => {
  const response = await api.patch<Invoice>(`/invoices/${id}/status/`, { status });
  return response.data;
};

export const listInvoicePayments = async (id: number) => {
  const response = await api.get<Payment[]>(`/invoices/${id}/payments/`);
  return response.data;
};

