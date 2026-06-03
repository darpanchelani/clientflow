import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useAppDispatch } from '../store';
import {
  removeProject,
  setPagination,
  setProjects,
  upsertProject,
  setSelectedProject,
} from '../store/slices/projectsSlice';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../services/projectsApi';
import { ProjectFormValues, ProjectsFilters } from '../types/projects';

export const useProjectsQuery = (filters: ProjectsFilters) => {
  const dispatch = useAppDispatch();
  return useQuery(['projects', filters], () => listProjects(filters), {
    keepPreviousData: true,
    onSuccess: (data) => {
      dispatch(setProjects(data.results));
      dispatch(setPagination({ next: data.next, previous: data.previous }));
    },
  });
};

export const useProjectQuery = (projectId?: number) => {
  const dispatch = useAppDispatch();
  return useQuery(['project', projectId], () => getProject(projectId as number), {
    enabled: Boolean(projectId),
    onSuccess: (data) => dispatch(setSelectedProject(data)),
  });
};

export const useCreateProjectMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((payload: ProjectFormValues) => createProject(payload), {
    onSuccess: (project) => {
      dispatch(upsertProject(project));
      queryClient.invalidateQueries('projects');
    },
  });
};

export const useUpdateProjectMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: ProjectFormValues }) =>
      updateProject(id, payload),
    {
      onSuccess: (project) => {
        dispatch(upsertProject(project));
        queryClient.invalidateQueries('projects');
        queryClient.invalidateQueries('project');
      },
    }
  );
};

export const useDeleteProjectMutation = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation((id: number) => deleteProject(id), {
    onSuccess: (id) => {
      dispatch(removeProject(id));
      queryClient.invalidateQueries('projects');
    },
  });
};

