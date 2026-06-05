export type AISeverity = 'critical' | 'warning' | 'info' | 'success' | 'low' | 'medium' | 'high';
export type AICategory =
  | 'lead'
  | 'client'
  | 'invoice'
  | 'project'
  | 'task'
  | 'revenue'
  | 'workflow'
  | 'system'
  | 'sales'
  | 'billing'
  | 'productivity';

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AIPrediction {
  id: number;
  user: number;
  user_email?: string;
  entity_type: 'lead' | 'client' | 'project' | 'task' | 'invoice';
  entity_id: number;
  prediction_type: string;
  score: string | null;
  probability: string | null;
  confidence: string | null;
  result: Record<string, unknown>;
  explanation: string;
  created_at: string;
}

export interface AIInsight {
  id: number;
  user: number;
  user_email?: string;
  title: string;
  description: string;
  category: AICategory;
  severity: AISeverity;
  recommendation: string;
  source_type: string;
  source_id: number | null;
  score: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProposalDraft {
  id: number;
  user: number;
  user_email?: string;
  client: number | null;
  lead: number | null;
  project: number | null;
  title: string;
  generated_content: string;
  status: 'draft' | 'approved' | 'archived';
  proposal_type: 'service' | 'project' | 'retainer' | 'custom';
  estimated_budget: string | null;
  estimated_timeline: string;
  services_offered: string;
  client_problem: string;
  proposed_solution: string;
  source?: 'openai' | 'template';
  created_at: string;
  updated_at: string;
}

export interface LeadScoreResponse {
  prediction_id: number;
  score: number;
  conversion_probability: number;
  priority: 'low' | 'medium' | 'high';
  recommendation: string;
  explanation: string;
  features: Record<string, unknown>;
}

export interface BulkLeadScoreResponse {
  count: number;
  results: LeadScoreResponse[];
}

export interface PaymentRiskResponse {
  prediction_id: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  delay_probability: number;
  recommendation: string;
  explanation: string;
  features: Record<string, unknown>;
}

export interface ClientHealthResponse {
  prediction_id: number;
  churn_score: number;
  risk_level: 'low' | 'medium' | 'high';
  health_score: number;
  retention_recommendation: string;
  explanation: string;
  features: {
    client_id?: number;
    total_revenue?: string;
    unpaid_invoice_count?: number;
    overdue_invoice_count?: number;
    active_project_count?: number;
    completed_project_count?: number;
    [key: string]: unknown;
  };
}

export interface ClientHealthListResponse {
  count: number;
  results: ClientHealthResponse[];
}

export interface RevenueForecastResponse {
  current_month_revenue: string;
  previous_month_revenue: string;
  projected_monthly_revenue: string;
  quarterly_forecast: string;
  outstanding_expected_revenue: string;
  overdue_risk_adjustment: string;
  trend_direction: 'up' | 'down' | 'flat';
  confidence: 'low' | 'medium' | 'high';
  features: {
    current_month_paid_revenue: string;
    previous_month_paid_revenue: string;
    outstanding_invoice_value: string;
    overdue_invoice_value: string;
    average_monthly_revenue: string;
    payment_completion_rate: number;
    invoice_count: number;
    paid_invoice_count: number;
  };
}

export interface AIRecommendation {
  id?: number;
  title: string;
  recommendation: string;
  category: AICategory;
  severity: AISeverity;
}

export interface GenerateProposalPayload {
  lead_id?: number | null;
  client_id?: number | null;
  project_id?: number | null;
  title: string;
  proposal_type: ProposalDraft['proposal_type'];
  estimated_budget?: string | null;
  estimated_timeline?: string;
  services_offered: string;
  client_problem?: string;
  proposed_solution?: string;
  tone?: 'professional' | 'friendly' | 'persuasive' | 'formal';
  include_payment_terms?: boolean;
  include_timeline?: boolean;
  include_deliverables?: boolean;
}

export type GenerateProposalResponse = ProposalDraft & {
  source: 'openai' | 'template';
};

export interface AIInsightFilters {
  category?: string;
  severity?: string;
  is_read?: string;
  date_from?: string;
  date_to?: string;
  cursor?: string | null;
}

export interface AIProposalFilters {
  status?: string;
  proposal_type?: string;
  lead_id?: string;
  client_id?: string;
  project_id?: string;
  cursor?: string | null;
}

export interface AIPredictionFilters {
  entity_type?: string;
  entity_id?: string;
  prediction_type?: string;
  cursor?: string | null;
}
