import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useAppDispatch } from '../store';
import {
  clearInvoices,
  removeInvoice,
  setInvoices,
  setPagination,
  upsertInvoice,
  setSelectedInvoice,
} from '../store/slices/invoicesSlice';
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoicePayments,
  listInvoices,
  sendInvoice,
  updateInvoice,
  updateInvoiceStatus,
} from '../services/invoicesApi';
import { InvoiceFilters, InvoiceFormValues } from '../types/billing';

export const useInvoicesQuery = (filters: InvoiceFilters) => {
  const dispatch = useAppDispatch();
  return useQuery(['invoices', filters], () => listInvoices(filters), {
    keepPreviousData: true,
    onSuccess: (data) => {
      dispatch(setInvoices(data.results));
      dispatch(setPagination({ next: data.next, previous: data.previous }));
    },
  });
};

export const useInvoiceQuery = (invoiceId?: number) => {
  const dispatch = useAppDispatch();
  return useQuery(['invoice', invoiceId], () => getInvoice(invoiceId as number), {
    enabled: Boolean(invoiceId),
    onSuccess: (data) => dispatch(setSelectedInvoice(data)),
  });
};

export const useInvoicePaymentsQuery = (invoiceId?: number) =>
  useQuery(['invoice-payments', invoiceId], () => listInvoicePayments(invoiceId as number), {
    enabled: Boolean(invoiceId),
  });

export const useCreateInvoiceMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((payload: InvoiceFormValues) => createInvoice(payload), {
    onSuccess: (invoice) => {
      dispatch(upsertInvoice(invoice));
      queryClient.invalidateQueries('invoices');
    },
  });
};

export const useUpdateInvoiceMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: InvoiceFormValues }) =>
      updateInvoice(id, payload),
    {
      onSuccess: (invoice) => {
        dispatch(upsertInvoice(invoice));
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('invoice');
      },
    }
  );
};

export const useDeleteInvoiceMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((id: number) => deleteInvoice(id), {
    onSuccess: (id) => {
      dispatch(removeInvoice(id));
      queryClient.invalidateQueries('invoices');
    },
  });
};

export const useSendInvoiceMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((id: number) => sendInvoice(id), {
    onSuccess: (invoice) => {
      dispatch(upsertInvoice(invoice));
      queryClient.invalidateQueries('invoices');
      queryClient.invalidateQueries('invoice');
    },
  });
};

export const useUpdateInvoiceStatusMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, status }: { id: number; status: string }) => updateInvoiceStatus(id, status as any),
    {
      onSuccess: (invoice) => {
        dispatch(upsertInvoice(invoice));
        queryClient.invalidateQueries('invoices');
        queryClient.invalidateQueries('invoice');
      },
    }
  );
};

export const useResetInvoices = () => {
  const dispatch = useAppDispatch();
  return () => dispatch(clearInvoices());
};

