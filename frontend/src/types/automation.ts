import { Lead } from './crm';
import { UserSummary } from './projects';

export interface NotificationItem {
  id: number;
  category: 'billing' | 'crm' | 'project' | 'task' | 'workflow' | 'system';
  title: string;
  message: string;
  target_type: string | null;
  target_object_id: number | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface WorkflowRule {
  id: number;
  name: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  conditions: Record<string, unknown>;
  action_config: Record<string, unknown>;
  organization_name: string;
  created_by: UserSummary;
  created_at: string;
  updated_at: string;
}

export interface AutomationPreference {
  id: number;
  in_app_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  lead_follow_up_days: number;
  task_due_soon_hours: number;
  invoice_before_due_days: number;
  invoice_after_overdue_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowUp {
  id: number;
  lead: Lead;
  assigned_user: UserSummary;
  due_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
  is_overdue: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GlobalActivity {
  id: number;
  actor: UserSummary | null;
  organization_name: string;
  source: string;
  verb: string;
  message: string;
  target_type: string | null;
  target_object_id: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AutomationDashboardSummary {
  overdue_invoices: number;
  upcoming_tasks: number;
  pending_follow_ups: number;
  overdue_follow_ups: number;
  active_projects: number;
  revenue_summary: string;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}
