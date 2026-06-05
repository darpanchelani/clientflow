import React from 'react';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';

import EmptyState from '../../common/EmptyState';

interface ProposalEmptyStateProps {
  onGenerate?: () => void;
}

const ProposalEmptyState = ({ onGenerate }: ProposalEmptyStateProps) => (
  <EmptyState
    title="No proposals saved yet"
    description="Generate a proposal from AI Insights, a lead, client, or project and it will appear here."
    actionLabel={onGenerate ? 'Generate Proposal' : undefined}
    onAction={onGenerate}
    icon={<ArticleOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
  />
);

export default ProposalEmptyState;
