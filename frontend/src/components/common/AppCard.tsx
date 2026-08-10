import React from 'react';
import { Card, CardContent, CardProps, Stack, Typography } from '@mui/material';

interface AppCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const AppCard = ({ title, subtitle, action, children, ...props }: AppCardProps) => (
  <Card {...props}>
    <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
      {(title || action) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{ mb: title || subtitle ? 2 : 0 }}
        >
          <Stack spacing={0.5}>
            {title ? (
              <Typography variant="h6" fontWeight={700}>
                {title}
              </Typography>
            ) : null}
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Stack>
          {action}
        </Stack>
      )}
      {children}
    </CardContent>
  </Card>
);

export default AppCard;
