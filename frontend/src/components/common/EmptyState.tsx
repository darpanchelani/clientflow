import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => (
  <Box
    sx={{
      py: 8,
      px: 3,
      textAlign: 'center',
      border: '1px dashed',
      borderColor: 'divider',
      borderRadius: 3,
      bgcolor: 'background.paper',
    }}
    role="status"
    aria-label={title}
  >
    <Stack spacing={2} alignItems="center">
      {icon ?? <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      <Typography color="text.secondary" maxWidth={480}>
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  </Box>
);

export default EmptyState;
