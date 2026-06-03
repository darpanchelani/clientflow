import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useAppDispatch } from '../store';
import {
  removeClient,
  setClients,
  setPagination,
  upsertClient,
} from '../store/slices/clientsSlice';
import { ClientFilters, ClientFormValues } from '../types/crm';
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../services/clientsApi';

export const useClientsQuery = (filters: ClientFilters) => {
  const dispatch = useAppDispatch();
  return useQuery(['clients', filters], () => listClients(filters), {
    keepPreviousData: true,
    onSuccess: (data) => {
      dispatch(setClients(data.results));
      dispatch(setPagination({ next: data.next, previous: data.previous }));
    },
  });
};

export const useCreateClientMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((payload: ClientFormValues) => createClient(payload), {
    onSuccess: (client) => {
      dispatch(upsertClient(client));
      queryClient.invalidateQueries('clients');
    },
  });
};

export const useUpdateClientMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: Partial<ClientFormValues> }) =>
      updateClient(id, payload),
    {
      onSuccess: (client) => {
        dispatch(upsertClient(client));
        queryClient.invalidateQueries('clients');
      },
    }
  );
};

export const useDeleteClientMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((id: number) => deleteClient(id), {
    onSuccess: (id) => {
      dispatch(removeClient(id));
      queryClient.invalidateQueries('clients');
    },
  });
};

