import api from './api';
import {
  PaginatedResponse,
  Task,
  TaskBoardResponse,
  TaskFormValues,
  TasksFilters,
} from '../types/projects';

const cleanParams = (params: TasksFilters & { cursor?: string | null }) => {
  const next: Record<string, string> = {};
  if (params.project) next.project = String(params.project);
  if (params.assigned_to !== undefined && params.assigned_to !== '') {
    next.assigned_to = String(params.assigned_to);
  }
  if (params.priority) next.priority = params.priority;
  if (params.search) next.search = params.search;
  if (params.cursor) next.cursor = params.cursor;
  return next;
};

export const listTasks = async (params: TasksFilters = {}) => {
  const response = await api.get<PaginatedResponse<Task>>('/tasks/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const getTask = async (id: number) => {
  const response = await api.get<Task>(`/tasks/${id}/`);
  return response.data;
};

export const getTaskBoard = async (params: TasksFilters = {}) => {
  const response = await api.get<TaskBoardResponse>('/tasks/board/', {
    params: cleanParams(params),
  });
  return response.data;
};

export const createTask = async (payload: TaskFormValues) => {
  const response = await api.post<Task>('/tasks/', payload);
  return response.data;
};

export const updateTask = async (id: number, payload: TaskFormValues) => {
  const response = await api.put<Task>(`/tasks/${id}/`, payload);
  return response.data;
};

export const deleteTask = async (id: number) => {
  await api.delete(`/tasks/${id}/`);
  return id;
};

export const updateTaskStatus = async (id: number, status: Task['status']) => {
  const response = await api.patch<Task>(`/tasks/${id}/status/`, { status });
  return response.data;
};

export const assignTask = async (id: number, assigned_to_id: number | null) => {
  const response = await api.patch<Task>(`/tasks/${id}/assign/`, { assigned_to_id });
  return response.data;
};

export const getTaskActivity = async (id: number) => {
  const response = await api.get(`/tasks/${id}/activity/`);
  return response.data;
};

