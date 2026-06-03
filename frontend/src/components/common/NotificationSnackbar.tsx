import React from 'react';
import { Alert, Button, Snackbar } from '@mui/material';

import { useAppDispatch, useAppSelector } from '../../store';
import { clearNotification } from '../../store/slices/uiSlice';

const NotificationSnackbar = () => {
  const dispatch = useAppDispatch();
  const notification = useAppSelector((state) => state.ui.notification);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    dispatch(clearNotification());
  };

  return (
    <Snackbar
      open={Boolean(notification)}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification?.severity ?? 'info'}
        variant="filled"
        sx={{ width: '100%', alignItems: 'center' }}
        role="alert"
        aria-live="polite"
      >
        {notification?.message}
        {notification?.actionLabel ? (
          <Button color="inherit" size="small" sx={{ ml: 1 }}>
            {notification.actionLabel}
          </Button>
        ) : null}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
