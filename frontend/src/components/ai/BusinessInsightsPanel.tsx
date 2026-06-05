import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DoneIcon from '@mui/icons-material/Done';

import AppCard from '../common/AppCard';
import { AIInsight, AIInsightFilters } from '../../types/ai';
import { getFriendlyErrorMessage } from '../../utils/apiError';
import AIEmptyState from './AIEmptyState';
import AILoadingState from './AILoadingState';
import InsightSeverityChip from './InsightSeverityChip';

interface BusinessInsightsPanelProps {
  insights?: AIInsight[];
  filters: AIInsightFilters;
  onFiltersChange: (filters: AIInsightFilters) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onMarkAllRead: () => void;
}

const categories = ['', 'lead', 'client', 'invoice', 'project', 'task', 'revenue', 'workflow', 'system'];
const severities = ['', 'critical', 'warning', 'info', 'success'];
const readStates = [
  { label: 'All', value: '' },
  { label: 'Unread', value: 'false' },
  { label: 'Read', value: 'true' },
];

const BusinessInsightsPanel = ({
  insights = [],
  filters,
  onFiltersChange,
  isLoading,
  isError,
  error,
  onRetry,
  onGenerate,
  isGenerating,
  onMarkRead,
  onDelete,
  onMarkAllRead,
}: BusinessInsightsPanelProps) => (
  <AppCard
    title="Business insights"
    subtitle="Recommendations generated from current business data."
    action={
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" onClick={onMarkAllRead} disabled={insights.length === 0}>
          Mark all read
        </Button>
        <Button variant="contained" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate insights'}
        </Button>
      </Stack>
    }
  >
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          select
          size="small"
          label="Category"
          value={filters.category ?? ''}
          onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })}
          sx={{ minWidth: 160 }}
        >
          {categories.map((category) => (
            <MenuItem key={category || 'all'} value={category}>
              {category || 'All'}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Severity"
          value={filters.severity ?? ''}
          onChange={(event) => onFiltersChange({ ...filters, severity: event.target.value })}
          sx={{ minWidth: 160 }}
        >
          {severities.map((severity) => (
            <MenuItem key={severity || 'all'} value={severity}>
              {severity || 'All'}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Read state"
          value={filters.is_read ?? ''}
          onChange={(event) => onFiltersChange({ ...filters, is_read: event.target.value })}
          sx={{ minWidth: 160 }}
        >
          {readStates.map((state) => (
            <MenuItem key={state.label} value={state.value}>
              {state.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading ? <AILoadingState cards={3} /> : null}

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {getFriendlyErrorMessage(error, 'Unable to load AI insights.')}
        </Alert>
      ) : null}

      {!isLoading && !isError && insights.length === 0 ? (
        <AIEmptyState
          title="No insights yet"
          description="No insights yet. Generate insights to analyze your business data."
          actionLabel="Generate insights"
          onAction={onGenerate}
        />
      ) : null}

      {!isLoading && !isError && insights.length > 0 ? (
        <Stack divider={<Divider flexItem />} spacing={0}>
          {insights.map((insight) => (
            <Box
              key={insight.id}
              sx={{
                py: 2,
                opacity: insight.is_read ? 0.72 : 1,
                bgcolor: insight.is_read ? 'transparent' : 'action.hover',
                px: 1.5,
                borderRadius: 2,
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <InsightSeverityChip severity={insight.severity} />
                    <Chip size="small" label={insight.category} sx={{ textTransform: 'capitalize' }} />
                    {!insight.is_read ? <Chip size="small" color="primary" label="Unread" /> : null}
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {insight.description}
                  </Typography>
                  {insight.recommendation ? (
                    <Typography variant="body2">{insight.recommendation}</Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(insight.created_at).toLocaleString()}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="flex-start">
                  {!insight.is_read ? (
                    <Tooltip title="Mark as read">
                      <IconButton onClick={() => onMarkRead(insight.id)}>
                        <DoneIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  <Tooltip title="Delete insight">
                    <IconButton color="error" onClick={() => onDelete(insight.id)}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : null}
    </Stack>
  </AppCard>
);

export default BusinessInsightsPanel;
