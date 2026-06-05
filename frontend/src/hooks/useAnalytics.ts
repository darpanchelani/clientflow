import { useQuery } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import { getAnalyticsDashboard } from '../services/analyticsApi';
import { AnalyticsFilters } from '../types/analytics';

export const useAnalyticsDashboardQuery = (filters: AnalyticsFilters) =>
  useQuery(queryKeys.analyticsDashboard(filters), () => getAnalyticsDashboard(filters), {
    refetchInterval: 2 * 60 * 1000,
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });
