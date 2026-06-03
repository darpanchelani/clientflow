import { useCallback, useState } from 'react';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  destructive?: boolean;
  confirmLabel?: string;
  onConfirm?: () => void | Promise<unknown>;
}

const initialState: ConfirmState = {
  open: false,
  title: '',
  message: '',
};

export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmState>(initialState);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback(
    (options: Omit<ConfirmState, 'open'> & { onConfirm: () => void | Promise<unknown> }) => {
      setState({ ...options, open: true });
    },
    []
  );

  const close = useCallback(() => {
    if (loading) return;
    setState(initialState);
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!state.onConfirm) return;
    setLoading(true);
    try {
      await state.onConfirm();
      setState(initialState);
    } finally {
      setLoading(false);
    }
  }, [state]);

  return {
    confirm,
    close,
    handleConfirm,
    loading,
    dialogProps: {
      open: state.open,
      title: state.title,
      message: state.message,
      destructive: state.destructive,
      confirmLabel: state.confirmLabel,
      loading,
      onClose: close,
      onConfirm: handleConfirm,
    },
  };
};
