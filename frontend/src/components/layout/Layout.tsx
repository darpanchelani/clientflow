import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import NotificationBell from '../notifications/NotificationBell';
import { useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Leads', path: '/leads' },
  { label: 'Clients', path: '/clients' },
  { label: 'Projects', path: '/projects' },
  { label: 'Invoices', path: '/invoices' },
  { label: 'Payments', path: '/payments' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'AI Insights', path: '/ai-insights' },
  { label: 'Proposals', path: '/proposals' },
  { label: 'Executive', path: '/executive' },
  { label: 'Reports', path: '/reports' },
  { label: 'Follow-ups', path: '/follow-ups' },
  { label: 'Activity', path: '/activity' },
  { label: 'Automation', path: '/automation' },
];

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const navContent = (
    <List sx={{ minWidth: 220 }}>
      {navItems.map((item) => (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            component={RouterLink}
            to={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => setDrawerOpen(false)}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1 }}>
          {isMobile ? (
            <IconButton edge="start" aria-label="Open navigation menu" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography
            component={RouterLink}
            to="/dashboard"
            variant="h6"
            sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: 800, flexGrow: isMobile ? 1 : 0, mr: 3 }}
          >
            ClientFlow
          </Typography>
          {!isMobile ? (
            <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  color={location.pathname.startsWith(item.path) ? 'primary' : 'inherit'}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}
          <NotificationBell />
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ pt: 2 }} role="navigation" aria-label="Main">
          {navContent}
        </Box>
      </Drawer>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
