import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface AppDialogProps extends Omit<DialogProps, 'title'> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

const AppDialog = ({
  title,
  subtitle,
  actions,
  onClose,
  children,
  maxWidth = 'md',
  fullWidth = true,
  ...props
}: AppDialogProps) => (
  <Dialog
    {...props}
    onClose={onClose}
    maxWidth={maxWidth}
    fullWidth={fullWidth}
    aria-labelledby="app-dialog-title"
    aria-describedby={subtitle ? 'app-dialog-subtitle' : undefined}
  >
    <DialogTitle id="app-dialog-title" sx={{ pr: 6 }}>
      <Typography variant="h6" component="span" fontWeight={700}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography id="app-dialog-subtitle" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
      <IconButton
        aria-label="Close dialog"
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    {actions ? <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions> : null}
  </Dialog>
);

export default AppDialog;
