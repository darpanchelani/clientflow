import api from './api';
import { UserSummary } from '../types/projects';

export const listUsers = async () => {
  const response = await api.get<UserSummary[]>('/users/');
  return response.data;
};

