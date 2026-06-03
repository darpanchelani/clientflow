import { useQuery, useQueryClient } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import { useMutationWithFeedback } from './useMutationWithFeedback';
import { createPayment, listPayments, verifyPayment } from '../services/paymentsApi';
import { PaymentFilters, PaymentFormValues } from '../types/billing';

export const usePaymentsQuery = (filters: PaymentFilters) =>
  useQuery(queryKeys.payments(filters), () => listPayments(filters), {
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });

export const useCreatePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutationWithFeedback((payload: PaymentFormValues) => createPayment(payload), {
    successMessage: 'Payment recorded',
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['invoice-payments']);
      queryClient.invalidateQueries(['invoice']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(queryKeys.dashboard);
    },
  });
};

export const useVerifyPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutationWithFeedback(
    ({ id, transactionId }: { id: number; transactionId?: string }) =>
      verifyPayment(id, transactionId),
    {
      successMessage: 'Payment verified',
      onSuccess: () => {
        queryClient.invalidateQueries(['payments']);
        queryClient.invalidateQueries(['invoice-payments']);
        queryClient.invalidateQueries(['invoice']);
        queryClient.invalidateQueries(['invoices']);
        queryClient.invalidateQueries(queryKeys.dashboard);
      },
    }
  );
};
