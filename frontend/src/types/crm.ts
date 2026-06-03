export interface Tag {
  id: number;
  name: string;
  color: string;
  organization_name: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  score: number;
  tags: Tag[];
  owner_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientLeadSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  source: string;
}

export interface Client {
  id: number;
  lead: ClientLeadSummary | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  tags: Tag[];
  owner_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LeadFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  score: number;
  tag_names: string[];
}

export interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  lead_id?: number | null;
  tag_names: string[];
}

export interface LeadFilters {
  search?: string;
  status?: string;
  source?: string;
  cursor?: string | null;
}

export interface ClientFilters {
  search?: string;
  status?: string;
  cursor?: string | null;
}

