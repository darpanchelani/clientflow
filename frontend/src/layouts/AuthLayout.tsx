import React from 'react';
import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const AuthLayout = ({ title, subtitle, children }: AuthLayoutProps) => {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container sx={{ minHeight: { md: 650 }, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
          <Grid item xs={12} md={5} sx={{ bgcolor: '#111A2D', color: '#F7F9FC', p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 30, height: 30, borderRadius: 2, bgcolor: 'primary.main', position: 'relative' }}>
                <Box sx={{ position: 'absolute', width: 12, height: 12, borderRadius: '3px', bgcolor: '#FFFFFF', left: 5, top: 5 }} />
                <Box sx={{ position: 'absolute', width: 9, height: 9, borderRadius: '3px', bgcolor: '#91A4FF', right: 4, bottom: 4 }} />
              </Box>
              <Typography variant="h6" fontWeight={800}>ClientFlow</Typography>
            </Stack>
            <Box sx={{ my: { xs: 5, md: 0 } }}>
              <Typography variant="h3" sx={{ color: '#FFFFFF', mb: 2, maxWidth: 380 }}>Run client work from one clear view.</Typography>
              <Typography sx={{ color: '#B6C1D3', maxWidth: 410, mb: 4 }}>Keep leads, delivery, billing, and business intelligence connected from first contact to final payment.</Typography>
              <Stack spacing={1.75}>
                {['Know which work needs attention', 'Keep revenue and delivery in sync', 'Turn live data into useful decisions'].map((item) => (
                  <Stack direction="row" spacing={1.25} alignItems="center" key={item}>
                    <CheckCircleOutlineIcon sx={{ color: '#91A4FF', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#E1E6EF' }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Typography variant="caption" sx={{ color: '#7F8DA6' }}>Secure, workspace-scoped access</Typography>
          </Grid>
          <Grid item xs={12} md={7} sx={{ p: { xs: 3, sm: 5, md: 7 }, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
              <Typography variant="h3" component="h1" gutterBottom>{title}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3.5 }}>{subtitle}</Typography>
              {children}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthLayout;
