export interface AnalyticsFilters {
  range?: 'today' | 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';
  start_date?: string;
  end_date?: string;
  client?: string;
  project?: string;
  team_member?: string;
}

export interface AnalyticsDashboard {
  range: { start_date: string; end_date: string };
  summary: {
    total_revenue: string;
    outstanding_revenue: string;
    overdue_revenue: string;
    invoice_count: number;
    paid_invoice_count: number;
    payment_count: number;
    lead_count: number;
    client_count: number;
    active_project_count: number;
    open_task_count: number;
  };
  sales_funnel: {
    new_leads: number;
    qualified_leads: number;
    converted_leads: number;
    lost_leads: number;
    conversion_rate: number;
    lead_velocity: number;
    pipeline_value: string;
    revenue_forecast: string;
  };
  revenue: {
    total_revenue: string;
    monthly_revenue: Array<{ month: string; total: string }>;
    outstanding_revenue: string;
    overdue_revenue: string;
    by_client: Array<{ client: string; total: string }>;
    by_project: Array<{ project: string; total: string }>;
  };
  projects: {
    active: number;
    completed: number;
    delayed: number;
    average_completion_days: number;
    status_breakdown: Array<{ status: string; count: number }>;
    team_workload: Array<{ assigned_to__email: string | null; open_tasks: number }>;
  };
  tasks: {
    completed: number;
    open: number;
    overdue: number;
    completion_rate: number;
    status_breakdown: Array<{ status: string; count: number }>;
    completion_trends: Array<{ date: string; count: number }>;
  };
  clients: {
    active: number;
    new: number;
    growth_rate: number;
    top_clients: Array<{ client: string; revenue: string }>;
    growth_trend: Array<{ date: string; count: number }>;
  };
  invoices: {
    status_breakdown: Array<{ status: string; count: number }>;
    overdue_count: number;
    paid_count: number;
  };
  payments: {
    completed: number;
    pending: number;
    failed: number;
  };
}
