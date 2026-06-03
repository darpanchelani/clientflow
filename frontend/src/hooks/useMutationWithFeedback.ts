import {
  MutationFunction,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query';

import { getFriendlyErrorMessage } from '../utils/apiError';
import { useNotification } from './useNotification';

type FeedbackOptions<TData, TError, TVariables, TContext> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> & {
  successMessage?: string;
  errorMessage?: string;
};

export function useMutationWithFeedback<TData, TError, TVariables, TContext>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: FeedbackOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>;

export function useMutationWithFeedback<TData, TError, TVariables, TContext>(
  options: FeedbackOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>;

export function useMutationWithFeedback<TData, TError, TVariables, TContext>(
  arg1:
    | MutationFunction<TData, TVariables>
    | FeedbackOptions<TData, TError, TVariables, TContext>,
  arg2?: FeedbackOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const notify = useNotification();
  const options =
    typeof arg1 === 'function' ? { mutationFn: arg1, ...arg2 } : arg1;

  const { successMessage, errorMessage, onSuccess, onError, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        notify.success(successMessage);
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      notify.error(getFriendlyErrorMessage(error, errorMessage));
      onError?.(error, variables, context);
    },
  });
}
