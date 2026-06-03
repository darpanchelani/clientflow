import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingLabel?: string;
}

const LoadingButton = ({
  loading,
  loadingLabel,
  children,
  disabled,
  startIcon,
  ...props
}: LoadingButtonProps) => (
  <Button
    {...props}
    disabled={disabled || loading}
    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
    aria-busy={loading ? 'true' : 'false'}
  >
    {loading ? loadingLabel ?? children : children}
  </Button>
);

export default LoadingButton;
