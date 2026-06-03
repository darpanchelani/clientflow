import { Client } from './crm';
import { Project } from './projects';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: string;
  unit_price: string;
  total_price?: string;
}

export interface InvoiceSummary {
  id: number;
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  total: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client: Client;
  project: Project | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: string;
  tax: string;
  total: string;
  balance_due: string;
  is_overdue: boolean;
  notes: string;
  items: InvoiceItem[];
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice: InvoiceSummary;
  amount: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'stripe_mock';
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  paid_at: string | null;
  balance_after_payment?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface InvoiceFilters {
  search?: string;
  status?: string;
  client?: string;
  project?: string;
  issue_date_after?: string;
  issue_date_before?: string;
  due_date_after?: string;
  due_date_before?: string;
  cursor?: string | null;
}

export interface InvoiceFormItem {
  description: string;
  quantity: string;
  unit_price: string;
}

export interface InvoiceFormValues {
  client_id: number;
  project_id?: number | null;
  issue_date: string;
  due_date: string;
  tax: string;
  notes: string;
  items: InvoiceFormItem[];
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  invoice?: string;
}

export interface PaymentFormValues {
  invoice_id: number;
  amount: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'stripe_mock';
  status?: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
}

