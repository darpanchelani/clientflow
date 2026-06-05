import React from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import EmptyState from '../common/EmptyState';

interface AIEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const AIEmptyState = ({
  title = 'No AI data yet',
  description = 'Generate insights to analyze your business data.',
  actionLabel,
  onAction,
}: AIEmptyStateProps) => (
  <EmptyState
    title={title}
    description={description}
    actionLabel={actionLabel}
    onAction={onAction}
    icon={<AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main' }} />}
  />
);

export default AIEmptyState;
