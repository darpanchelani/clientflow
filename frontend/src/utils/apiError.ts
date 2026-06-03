import { AxiosError } from 'axios';

export type ApiErrorPayload = {
  detail?: string;
  error?: string;
  message?: string;
  fields?: Record<string, string[] | string>;
  non_field_errors?: string[];
};

const flattenFieldErrors = (fields: Record<string, string[] | string>) =>
  Object.entries(fields)
    .flatMap(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [messages];
      return list.filter(Boolean).map((message) => `${field}: ${message}`);
    })
    .join(' ');

export const parseApiErrorPayload = (payload: unknown): string | null => {
  if (!payload) return null;
  if (typeof payload === 'string') return payload;

  const data = payload as ApiErrorPayload;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors.join(' ');
  }
  if (data.fields && typeof data.fields === 'object') {
    const flattened = flattenFieldErrors(data.fields);
    if (flattened) return flattened;
  }
  return null;
};

export const getFriendlyErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  const axiosError = error as AxiosError<ApiErrorPayload>;
  if (!axiosError.response) {
    return 'Network error. Check your connection and try again.';
  }

  const status = axiosError.response.status;
  const parsed = parseApiErrorPayload(axiosError.response.data);

  if (parsed) {
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return parsed || 'You do not have permission to perform this action.';
    if (status === 404) return parsed || 'The requested resource was not found.';
    if (status >= 500) return 'Server error. Please try again in a moment.';
    return parsed;
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please review the form and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Validation failed. Please review your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    default:
      if (status >= 500) return 'Server error. Please try again in a moment.';
      return fallback;
  }
};

export const isUnauthorizedError = (error: unknown) =>
  (error as AxiosError)?.response?.status === 401;
