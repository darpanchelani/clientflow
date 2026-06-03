import { useQuery } from 'react-query';

import { listUsers } from '../services/usersApi';

export const useUsersQuery = () => {
  return useQuery(['users'], listUsers, {
    staleTime: 5 * 60 * 1000,
  });
};

