import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Lead } from '../../types/crm';

interface LeadsState {
  items: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    source?: string;
    search?: string;
  };
  pagination: {
    next: string | null;
    previous: string | null;
  };
}

const initialState: LeadsState = {
  items: [],
  selectedLead: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    next: null,
    previous: null,
  },
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setLeads: (state, action: PayloadAction<Lead[]>) => {
      state.items = action.payload;
    },
    upsertLead: (state, action: PayloadAction<Lead>) => {
      const index = state.items.findIndex((lead) => lead.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
      if (state.selectedLead?.id === action.payload.id) {
        state.selectedLead = action.payload;
      }
    },
    removeLead: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((lead) => lead.id !== action.payload);
      if (state.selectedLead?.id === action.payload) {
        state.selectedLead = null;
      }
    },
    setSelectedLead: (state, action: PayloadAction<Lead | null>) => {
      state.selectedLead = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<{ status?: string; source?: string; search?: string }>
    ) => {
      state.filters = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{ next: string | null; previous: string | null }>
    ) => {
      state.pagination = action.payload;
    },
    clearLeads: (state) => {
      state.items = [];
      state.selectedLead = null;
      state.pagination = { next: null, previous: null };
    },
  },
});

export const {
  setLeads,
  upsertLead,
  removeLead,
  setSelectedLead,
  setLoading,
  setError,
  setFilters,
  setPagination,
  clearLeads,
} = leadsSlice.actions;

export default leadsSlice.reducer;

