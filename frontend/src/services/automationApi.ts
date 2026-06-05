import api from './api';
import {
  AutomationDashboardSummary,
  AutomationPreference,
  GlobalActivity,
  LeadFollowUp,
  NotificationItem,
  PaginatedResponse,
  WorkflowRule,
} from '../types/automation';

export const listNotifications = async (params: { is_read?: boolean } = {}) => {
  const response = await api.get<PaginatedResponse<NotificationItem>>('/notifications/', { params });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get<{ count: number }>('/notifications/unread-count/');
  return response.data;
};

export const markNotificationRead = async (id: number) => {
  const response = await api.post<NotificationItem>(`/notifications/${id}/mark-read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.post<{ updated: number }>('/notifications/mark-all-read/');
  return response.data;
};

export const listWorkflowRules = async () => {
  const response = await api.get<PaginatedResponse<WorkflowRule>>('/automation/workflow-rules/');
  return response.data;
};

export const updateWorkflowRule = async (id: number, payload: Partial<WorkflowRule>) => {
  const response = await api.patch<WorkflowRule>(`/automation/workflow-rules/${id}/`, payload);
  return response.data;
};

export const getAutomationPreferences = async () => {
  const response = await api.get<AutomationPreference>('/automation/preferences/');
  return response.data;
};

export const updateAutomationPreferences = async (payload: Partial<AutomationPreference>) => {
  const response = await api.patch<AutomationPreference>('/automation/preferences/', payload);
  return response.data;
};

export const listFollowUps = async (params: { status?: string } = {}) => {
  const response = await api.get<PaginatedResponse<LeadFollowUp>>('/automation/follow-ups/', { params });
  return response.data;
};

export const completeFollowUp = async (id: number) => {
  const response = await api.post<LeadFollowUp>(`/automation/follow-ups/${id}/complete/`);
  return response.data;
};

export const listActivityFeed = async (params: { source?: string } = {}) => {
  const response = await api.get<PaginatedResponse<GlobalActivity>>('/automation/activity-feed/', { params });
  return response.data;
};

export const getAutomationDashboardSummary = async () => {
  const response = await api.get<AutomationDashboardSummary>('/automation/dashboard-summary/');
  return response.data;
};
