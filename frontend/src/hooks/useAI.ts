import { useMutation, useQuery, useQueryClient } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import {
  approveProposal,
  archiveProposal,
  bulkScoreLeads,
  deleteInsight,
  deleteProposal,
  generateInsights,
  generateProposal,
  getClientChurnRisk,
  getClientHealth,
  getInsights,
  getLeadScore,
  getPaymentRisk,
  getPaymentRisks,
  getProposal,
  getProposals,
  getRevenueForecast,
  markAllInsightsRead,
  markInsightRead,
  updateProposal,
} from '../services/aiApi';
import {
  AIInsight,
  AIInsightFilters,
  AIProposalFilters,
  AIPredictionFilters,
  GenerateProposalPayload,
  PaginatedResponse,
  ProposalDraft,
} from '../types/ai';

export const useRevenueForecast = (filters: Record<string, string> = {}) =>
  useQuery(queryKeys.aiRevenueForecast(filters), () => getRevenueForecast(filters), {
    staleTime: 10 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

export const useAIInsights = (filters: AIInsightFilters = {}) =>
  useQuery(queryKeys.aiInsights(filters), () => getInsights(filters), {
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });

export const usePaymentRisks = (filters: AIPredictionFilters = {}) =>
  useQuery(queryKeys.aiPaymentRisks(filters), () => getPaymentRisks(filters), {
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

export const useClientHealth = (filters: Record<string, string> = {}) =>
  useQuery(queryKeys.aiClientHealth(filters), () => getClientHealth(filters), {
    staleTime: 5 * 60 * 1000,
  });

export const useProposals = (filters: AIProposalFilters = {}) =>
  useQuery(queryKeys.aiProposals(filters), () => getProposals(filters), {
    keepPreviousData: true,
  });

export const useProposal = (id?: number, enabled = true) =>
  useQuery(queryKeys.aiProposal(id), () => getProposal(id as number), {
    enabled: Boolean(id) && enabled,
  });

export const useLeadScore = (leadId?: number, enabled = true) =>
  useQuery(queryKeys.aiLeadScore(leadId), () => getLeadScore(leadId as number), {
    enabled: Boolean(leadId) && enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useBulkLeadScoreMutation = () => {
  const queryClient = useQueryClient();
  return useMutation((payload: { lead_ids?: number[] } = {}) => bulkScoreLeads(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries('ai-lead-score');
    },
  });
};

export const usePaymentRisk = (invoiceId?: number, enabled = true) =>
  useQuery(queryKeys.aiPaymentRisk(invoiceId), () => getPaymentRisk(invoiceId as number), {
    enabled: Boolean(invoiceId) && enabled,
    staleTime: 5 * 60 * 1000,
  });

export const useClientChurnRisk = (clientId?: number, enabled = true) =>
  useQuery(queryKeys.aiClientChurnRisk(clientId), () => getClientChurnRisk(clientId as number), {
    enabled: Boolean(clientId) && enabled,
  });

export const useGenerateInsightsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(generateInsights, {
    onSuccess: () => {
      queryClient.invalidateQueries('ai-insights');
      queryClient.invalidateQueries('notifications');
      queryClient.invalidateQueries('notification-unread-count');
    },
  });
};

export const useMarkInsightReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(markInsightRead, {
    onMutate: async (id) => {
      await queryClient.cancelQueries('ai-insights');
      const snapshots = queryClient.getQueriesData<PaginatedResponse<AIInsight>>('ai-insights');
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          results: data.results.map((insight) =>
            insight.id === id ? { ...insight, is_read: true } : insight
          ),
        });
      });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries('ai-insights');
    },
  });
};

export const useMarkAllInsightsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(markAllInsightsRead, {
    onMutate: async () => {
      await queryClient.cancelQueries('ai-insights');
      const snapshots = queryClient.getQueriesData<PaginatedResponse<AIInsight>>('ai-insights');
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          results: data.results.map((insight) => ({ ...insight, is_read: true })),
        });
      });
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries('ai-insights');
    },
  });
};

export const useDeleteInsightMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteInsight, {
    onMutate: async (id) => {
      await queryClient.cancelQueries('ai-insights');
      const snapshots = queryClient.getQueriesData<PaginatedResponse<AIInsight>>('ai-insights');
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          results: data.results.filter((insight) => insight.id !== id),
        });
      });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries('ai-insights');
    },
  });
};

export const useGenerateProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation((payload: GenerateProposalPayload) => generateProposal(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries('ai-proposals');
      queryClient.invalidateQueries('ai-proposal');
    },
  });
};

export const useUpdateProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: Partial<ProposalDraft> }) =>
      updateProposal(id, payload),
    {
      onSuccess: (proposal) => {
        queryClient.invalidateQueries('ai-proposals');
        queryClient.invalidateQueries(queryKeys.aiProposal(proposal.id));
      },
    }
  );
};

export const useDeleteProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(deleteProposal, {
    onSuccess: (id) => {
      queryClient.invalidateQueries('ai-proposals');
      queryClient.removeQueries(queryKeys.aiProposal(id));
    },
  });
};

export const useApproveProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(approveProposal, {
    onSuccess: (proposal) => {
      queryClient.invalidateQueries('ai-proposals');
      queryClient.invalidateQueries(queryKeys.aiProposal(proposal.id));
    },
  });
};

export const useArchiveProposalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(archiveProposal, {
    onSuccess: (proposal) => {
      queryClient.invalidateQueries('ai-proposals');
      queryClient.invalidateQueries(queryKeys.aiProposal(proposal.id));
    },
  });
};
