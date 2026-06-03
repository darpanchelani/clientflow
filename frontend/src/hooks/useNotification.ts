import { useCallback } from 'react';

import { useAppDispatch } from '../store';
import {
  clearNotification,
  NotificationSeverity,
  showNotification,
} from '../store/slices/uiSlice';

export const useNotification = () => {
  const dispatch = useAppDispatch();

  const notify = useCallback(
    (message: string, severity: NotificationSeverity = 'info', actionLabel?: string) => {
      dispatch(showNotification({ message, severity, actionLabel }));
    },
    [dispatch]
  );

  return {
    success: (message: string) => notify(message, 'success'),
    error: (message: string) => notify(message, 'error'),
    warning: (message: string) => notify(message, 'warning'),
    info: (message: string) => notify(message, 'info'),
    dismiss: () => dispatch(clearNotification()),
  };
};
