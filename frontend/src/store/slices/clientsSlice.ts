import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Client } from '../../types/crm';

interface ClientsState {
  items: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    search?: string;
  };
  pagination: {
    next: string | null;
    previous: string | null;
  };
}

const initialState: ClientsState = {
  items: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    next: null,
    previous: null,
  },
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setClients: (state, action: PayloadAction<Client[]>) => {
      state.items = action.payload;
    },
    upsertClient: (state, action: PayloadAction<Client>) => {
      const index = state.items.findIndex((client) => client.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
      if (state.selectedClient?.id === action.payload.id) {
        state.selectedClient = action.payload;
      }
    },
    removeClient: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((client) => client.id !== action.payload);
      if (state.selectedClient?.id === action.payload) {
        state.selectedClient = null;
      }
    },
    setSelectedClient: (state, action: PayloadAction<Client | null>) => {
      state.selectedClient = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<{ status?: string; search?: string }>
    ) => {
      state.filters = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{ next: string | null; previous: string | null }>
    ) => {
      state.pagination = action.payload;
    },
    clearClients: (state) => {
      state.items = [];
      state.selectedClient = null;
      state.pagination = { next: null, previous: null };
    },
  },
});

export const {
  setClients,
  upsertClient,
  removeClient,
  setSelectedClient,
  setLoading,
  setError,
  setFilters,
  setPagination,
  clearClients,
} = clientsSlice.actions;

export default clientsSlice.reducer;

