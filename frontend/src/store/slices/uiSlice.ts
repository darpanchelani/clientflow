import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  actionLabel?: string;
}

interface UiState {
  sidebarOpen: boolean;
  notification: AppNotification | null;
}

const initialState: UiState = {
  sidebarOpen: false,
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    showNotification: (state, action: PayloadAction<Omit<AppNotification, 'id'> & { id?: string }>) => {
      state.notification = {
        id: action.payload.id ?? `${Date.now()}`,
        message: action.payload.message,
        severity: action.payload.severity,
        actionLabel: action.payload.actionLabel,
      };
    },
    clearNotification: (state) => {
      state.notification = null;
    },
  },
});

export const { setSidebarOpen, toggleSidebar, showNotification, clearNotification } = uiSlice.actions;

export default uiSlice.reducer;
