import { useQuery, useQueryClient } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import { useMutationWithFeedback } from './useMutationWithFeedback';
import { useAppDispatch } from '../store';
import {
  clearLeads,
  removeLead,
  setLeads,
  setPagination,
  upsertLead,
} from '../store/slices/leadsSlice';
import { Lead, LeadFilters, LeadFormValues } from '../types/crm';
import {
  createLead,
  deleteLead,
  listLeads,
  updateLead,
  updateLeadStatus,
} from '../services/leadsApi';

export const useLeadsQuery = (filters: LeadFilters) => {
  const dispatch = useAppDispatch();
  return useQuery(queryKeys.leads(filters), () => listLeads(filters), {
    keepPreviousData: true,
    onSuccess: (data) => {
      dispatch(setLeads(data.results));
      dispatch(setPagination({ next: data.next, previous: data.previous }));
    },
  });
};

export const useCreateLeadMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutationWithFeedback((payload: LeadFormValues) => createLead(payload), {
    successMessage: 'Lead created successfully',
    onSuccess: (lead) => {
      dispatch(upsertLead(lead));
      queryClient.invalidateQueries(['leads']);
    },
  });
};

export const useUpdateLeadMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutationWithFeedback(
    ({ id, payload }: { id: number; payload: Partial<LeadFormValues> }) =>
      updateLead(id, payload),
    {
      successMessage: 'Lead updated successfully',
      onSuccess: (lead) => {
        dispatch(upsertLead(lead));
        queryClient.invalidateQueries(['leads']);
      },
    }
  );
};

export const useDeleteLeadMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutationWithFeedback((id: number) => deleteLead(id), {
    successMessage: 'Lead deleted',
    onMutate: async (id) => {
      await queryClient.cancelQueries(['leads']);
      const previous = queryClient.getQueriesData<{ results: Lead[] }>(['leads']);
      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          results: data.results.filter((lead) => lead.id !== id),
        });
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: (id) => {
      dispatch(removeLead(id));
      queryClient.invalidateQueries(['leads']);
    },
  });
};

export const useUpdateLeadStatusMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutationWithFeedback(
    ({ id, status }: { id: number; status: string }) => updateLeadStatus(id, status),
    {
      onMutate: async ({ id, status }) => {
        await queryClient.cancelQueries(['leads']);
        const previous = queryClient.getQueriesData<{ results: Lead[] }>(['leads']);
        previous.forEach(([key, data]) => {
          if (!data) return;
          queryClient.setQueryData(key, {
            ...data,
            results: data.results.map((lead) =>
              lead.id === id ? { ...lead, status } : lead
            ),
          });
        });
        return { previous };
      },
      onError: (_error, _vars, context) => {
        context?.previous.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      },
      onSuccess: (lead) => {
        dispatch(upsertLead(lead));
        queryClient.invalidateQueries(['leads']);
      },
    }
  );
};

export const useResetLeads = () => {
  const dispatch = useAppDispatch();
  return () => dispatch(clearLeads());
};
