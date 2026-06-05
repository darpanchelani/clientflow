import React from 'react';
import { Chip, ChipProps } from '@mui/material';

import { AISeverity } from '../../types/ai';

const colorMap: Record<string, ChipProps['color']> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
  high: 'error',
  medium: 'warning',
  low: 'success',
};

interface InsightSeverityChipProps {
  severity: AISeverity | string;
  size?: ChipProps['size'];
}

const InsightSeverityChip = ({ severity, size = 'small' }: InsightSeverityChipProps) => (
  <Chip
    size={size}
    color={colorMap[severity] ?? 'default'}
    label={severity}
    sx={{ textTransform: 'capitalize', fontWeight: 700 }}
  />
);

export default InsightSeverityChip;
