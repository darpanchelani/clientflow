import { useMutation, useQuery, useQueryClient } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import {
  completeFollowUp,
  getAutomationDashboardSummary,
  getAutomationPreferences,
  getUnreadNotificationCount,
  listActivityFeed,
  listFollowUps,
  listNotifications,
  listWorkflowRules,
  markAllNotificationsRead,
  markNotificationRead,
  updateAutomationPreferences,
  updateWorkflowRule,
} from '../services/automationApi';
import { AutomationPreference, WorkflowRule } from '../types/automation';

export const useNotificationsQuery = (params: { is_read?: boolean } = {}) =>
  useQuery(queryKeys.notifications(params), () => listNotifications(params), {
    refetchInterval: 60 * 1000,
  });

export const useUnreadNotificationsQuery = () =>
  useQuery(queryKeys.notificationUnreadCount, getUnreadNotificationCount, {
    refetchInterval: 60 * 1000,
  });

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(markNotificationRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries(queryKeys.notificationUnreadCount);
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(markAllNotificationsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries(queryKeys.notificationUnreadCount);
    },
  });
};

export const useWorkflowRulesQuery = () =>
  useQuery(queryKeys.workflowRules, listWorkflowRules);

export const useUpdateWorkflowRuleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: Partial<WorkflowRule> }) => updateWorkflowRule(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.workflowRules);
      },
    }
  );
};

export const useAutomationPreferencesQuery = () =>
  useQuery(queryKeys.automationPreferences, getAutomationPreferences);

export const useUpdateAutomationPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (payload: Partial<AutomationPreference>) => updateAutomationPreferences(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.automationPreferences);
      },
    }
  );
};

export const useFollowUpsQuery = (params: { status?: string } = {}) =>
  useQuery(queryKeys.followUps(params), () => listFollowUps(params));

export const useCompleteFollowUpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(completeFollowUp, {
    onSuccess: () => {
      queryClient.invalidateQueries('follow-ups');
      queryClient.invalidateQueries(queryKeys.automationDashboardSummary);
    },
  });
};

export const useActivityFeedQuery = (params: { source?: string } = {}) =>
  useQuery(queryKeys.activityFeed(params), () => listActivityFeed(params));

export const useAutomationDashboardSummaryQuery = () =>
  useQuery(queryKeys.automationDashboardSummary, getAutomationDashboardSummary, {
    staleTime: 60 * 1000,
  });
