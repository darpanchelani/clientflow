import { useMutation, useQuery, useQueryClient } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import {
  deleteAIReport,
  generateAIReport,
  getAIReportConfiguration,
  getAIReports,
  getAnalyticsDashboard,
} from '../services/analyticsApi';
import { AnalyticsFilters, GenerateAIReportPayload } from '../types/analytics';

export const useAnalyticsDashboardQuery = (filters: AnalyticsFilters) =>
  useQuery(queryKeys.analyticsDashboard(filters), () => getAnalyticsDashboard(filters), {
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

export const useAIReportsQuery = () =>
  useQuery(queryKeys.aiReports, getAIReports, { staleTime: 30 * 1000 });

export const useAIReportConfigurationQuery = () =>
  useQuery(queryKeys.aiReportConfiguration, getAIReportConfiguration, { staleTime: 5 * 60 * 1000 });

export const useGenerateAIReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation((payload: GenerateAIReportPayload) => generateAIReport(payload), {
    onSuccess: () => queryClient.invalidateQueries(queryKeys.aiReports),
  });
};

export const useDeleteAIReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteAIReport, {
    onSuccess: () => queryClient.invalidateQueries(queryKeys.aiReports),
  });
};
