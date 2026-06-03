import api from './api';
import {
  PaginatedResponse,
  Project,
  ProjectFormValues,
  ProjectsFilters,
} from '../types/projects';

const cleanParams = (params: ProjectsFilters) => {
  const next: Record<string, string> = {};
  if (params.search) next.search = params.search;
  if (params.status) next.status = params.status;
  if (params.client) next.client = params.client;
  if (params.start_date_after) next.start_date_after = params.start_date_after;
  if (params.start_date_before) next.start_date_before = params.start_date_before;
  if (params.end_date_after) next.end_date_after = params.end_date_after;
  if (params.end_date_before) next.end_date_before = params.end_date_before;
  if (params.cursor) next.cursor = params.cursor;
  return next;
};

export const listProjects = async (params: ProjectsFilters = {}) => {
  const response = await api.get<PaginatedResponse<Project>>('/projects/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const getProject = async (id: number) => {
  const response = await api.get<Project>(`/projects/${id}/`);
  return response.data;
};

export const createProject = async (payload: ProjectFormValues) => {
  const response = await api.post<Project>('/projects/', payload);
  return response.data;
};

export const updateProject = async (id: number, payload: ProjectFormValues) => {
  const response = await api.put<Project>(`/projects/${id}/`, payload);
  return response.data;
};

export const deleteProject = async (id: number) => {
  await api.delete(`/projects/${id}/`);
  return id;
};

