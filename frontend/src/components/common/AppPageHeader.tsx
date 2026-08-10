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
      <Typography variant="h3" component="h1" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" maxWidth={720} sx={{ textWrap: 'pretty' }}>
          {description}
        </Typography>
      ) : null}
    </Box>
    {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
  </Stack>
);

export default AppPageHeader;
