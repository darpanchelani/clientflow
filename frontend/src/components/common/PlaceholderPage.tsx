import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <Box>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PlaceholderPage;
