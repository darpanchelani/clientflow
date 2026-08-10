import api from './api';
import { PaginatedResponse, UserSummary } from '../types/projects';

export const listUsers = async () => {
  const response = await api.get<PaginatedResponse<UserSummary>>('/users/');
  return response.data.results;
};
