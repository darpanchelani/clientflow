import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

interface AppPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const AppPageHeader = ({ title, description, actions }: AppPageHeaderProps) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', md: 'center' }}
    spacing={2}
  >
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" maxWidth={720}>
          {description}
        </Typography>
      ) : null}
    </Box>
    {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
  </Stack>
);

export default AppPageHeader;
