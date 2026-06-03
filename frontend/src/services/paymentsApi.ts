import api from './api';
import { PaginatedResponse, Payment, PaymentFormValues, PaymentFilters } from '../types/billing';

const cleanParams = (params: PaymentFilters) => {
  const next: Record<string, string> = {};
  if (params.search) next.search = params.search;
  if (params.status) next.status = params.status;
  if (params.invoice) next.invoice = params.invoice;
  return next;
};

export const listPayments = async (params: PaymentFilters = {}) => {
  const response = await api.get<PaginatedResponse<Payment>>('/payments/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const createPayment = async (payload: PaymentFormValues) => {
  const response = await api.post<Payment>('/payments/', payload);
  return response.data;
};

export const getPayment = async (id: number) => {
  const response = await api.get<Payment>(`/payments/${id}/`);
  return response.data;
};

export const verifyPayment = async (id: number, transactionId?: string) => {
  const response = await api.post<Payment>(`/payments/${id}/verify/`, {
    transaction_id: transactionId || '',
  });
  return response.data;
};

