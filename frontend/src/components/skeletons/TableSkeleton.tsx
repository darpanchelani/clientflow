import React from 'react';
import { Paper, Skeleton, Stack } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton = ({ rows = 6, columns = 5 }: TableSkeletonProps) => (
  <Paper sx={{ p: 2 }} aria-busy="true" aria-label="Loading table">
    <Stack spacing={1.5}>
      <Skeleton variant="rounded" height={40} />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Stack key={rowIndex} direction="row" spacing={1}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} variant="rounded" height={36} sx={{ flex: 1 }} />
          ))}
        </Stack>
      ))}
    </Stack>
  </Paper>
);

export default TableSkeleton;
