import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Invoice } from '../../types/billing';

interface InvoicesState {
  items: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    next: string | null;
    previous: string | null;
  };
}

const initialState: InvoicesState = {
  items: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
  pagination: {
    next: null,
    previous: null,
  },
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.items = action.payload;
    },
    upsertInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.items.findIndex((invoice) => invoice.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
      if (state.selectedInvoice?.id === action.payload.id) {
        state.selectedInvoice = action.payload;
      }
    },
    removeInvoice: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((invoice) => invoice.id !== action.payload);
      if (state.selectedInvoice?.id === action.payload) {
        state.selectedInvoice = null;
      }
    },
    setSelectedInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.selectedInvoice = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{ next: string | null; previous: string | null }>
    ) => {
      state.pagination = action.payload;
    },
    clearInvoices: (state) => {
      state.items = [];
      state.selectedInvoice = null;
      state.pagination = { next: null, previous: null };
    },
  },
});

export const {
  setInvoices,
  upsertInvoice,
  removeInvoice,
  setSelectedInvoice,
  setLoading,
  setError,
  setPagination,
  clearInvoices,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
