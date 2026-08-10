import React from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';

import DashboardSkeleton from '../skeletons/DashboardSkeleton';
import TableSkeleton from '../skeletons/TableSkeleton';

interface QueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  skeleton?: 'table' | 'dashboard' | 'none';
  children: React.ReactNode;
}

const QueryState = ({
  isLoading,
  isError,
  errorMessage = 'Unable to load data right now.',
  onRetry,
  skeleton = 'table',
  children,
}: QueryStateProps) => {
  if (isLoading) {
    if (skeleton === 'table') return <TableSkeleton />;
    if (skeleton === 'dashboard') return <DashboardSkeleton />;
    return null;
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        {errorMessage}
      </Alert>
    );
  }

  return <>{children}</>;
};

export default QueryState;
