import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsQuery,
} from '../../hooks/useAutomation';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const notificationsQuery = useNotificationsQuery();
  const unreadQuery = useUnreadNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const open = Boolean(anchorEl);
  const notifications = notificationsQuery.data?.results ?? [];

  return (
    <>
      <IconButton color="inherit" aria-label="Notifications" onClick={(event) => setAnchorEl(event.currentTarget)}>
        <Badge badgeContent={unreadQuery.data?.count ?? 0} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: { xs: 320, sm: 420 }, maxWidth: 'calc(100vw - 24px)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Notifications
            </Typography>
            <Button size="small" onClick={() => markAllReadMutation.mutate()} disabled={(unreadQuery.data?.count ?? 0) === 0}>
              Mark all read
            </Button>
          </Stack>
          <Divider />
          {notifications.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No notifications yet.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 420, overflow: 'auto' }}>
              {notifications.slice(0, 10).map((notification) => (
                <ListItemButton
                  key={notification.id}
                  selected={!notification.is_read}
                  onClick={() => {
                    if (!notification.is_read) markReadMutation.mutate(notification.id);
                  }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={`${notification.message} · ${new Date(notification.created_at).toLocaleString()}`}
                    primaryTypographyProps={{ fontWeight: notification.is_read ? 500 : 800 }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
