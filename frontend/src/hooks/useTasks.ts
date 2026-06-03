import { useMutation, useQuery, useQueryClient } from 'react-query';

import {
  assignTask,
  createTask,
  deleteTask,
  getTaskActivity,
  getTaskBoard,
  listTasks,
  updateTask,
  updateTaskStatus,
} from '../services/tasksApi';
import { Task, TaskBoardResponse, TaskFormValues, TasksFilters } from '../types/projects';

const boardKey = (filters: TasksFilters) => ['task-board', filters];

const moveTaskBetweenColumns = (
  data: TaskBoardResponse | undefined,
  taskId: number,
  nextTask: Task,
  previousStatus?: Task['status']
) => {
  // if (!data) return data;
  if (!data) {
  return {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };
}

  const next: TaskBoardResponse = {
    todo: data.todo.filter((task) => task.id !== taskId),
    in_progress: data.in_progress.filter((task) => task.id !== taskId),
    review: data.review.filter((task) => task.id !== taskId),
    done: data.done.filter((task) => task.id !== taskId),
  };

  const sourceStatus = previousStatus || nextTask.status;
  const targetStatus = nextTask.status;
  const sourceKey = sourceStatus as keyof TaskBoardResponse;
  const targetKey = targetStatus as keyof TaskBoardResponse;

  if (next[sourceKey] && sourceKey === targetKey) {
    next[targetKey] = next[targetKey].map((task) => (task.id === taskId ? nextTask : task));
  } else {
    next[targetKey] = [nextTask, ...next[targetKey]];
  }

  return next;
};

export const useTasksQuery = (filters: TasksFilters) =>
  useQuery(['tasks', filters], () => listTasks(filters), {
    keepPreviousData: true,
  });

export const useTaskBoardQuery = (filters: TasksFilters, enabled = true) =>
  useQuery(boardKey(filters), () => getTaskBoard(filters), {
    keepPreviousData: true,
    enabled,
  });

export const useTaskActivityQuery = (taskId?: number) =>
  useQuery(['task-activity', taskId], () => getTaskActivity(taskId as number), {
    enabled: Boolean(taskId),
  });

export const useCreateTaskMutation = (filters: TasksFilters) => {
  const queryClient = useQueryClient();
  return useMutation((payload: TaskFormValues) => createTask(payload), {
    onSuccess: () => {
      queryClient.invalidateQueries(boardKey(filters));
      queryClient.invalidateQueries(['tasks', filters]);
    },
  });
};

export const useUpdateTaskMutation = (filters: TasksFilters) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, payload }: { id: number; payload: TaskFormValues }) => updateTask(id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(boardKey(filters));
        queryClient.invalidateQueries(['tasks', filters]);
      },
    }
  );
};

export const useDeleteTaskMutation = (filters: TasksFilters) => {
  const queryClient = useQueryClient();
  return useMutation((id: number) => deleteTask(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(boardKey(filters));
      queryClient.invalidateQueries(['tasks', filters]);
    },
  });
};

export const useUpdateTaskStatusMutation = (filters: TasksFilters) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, status }: { id: number; status: Task['status'] }) => updateTaskStatus(id, status),
    {
      onMutate: async ({ id, status }) => {
        await queryClient.cancelQueries(boardKey(filters));
        const previous = queryClient.getQueryData<TaskBoardResponse>(boardKey(filters));
        if (previous) {
          const found = (Object.values(previous).flat() as Task[]).find((task) => task.id === id);
          if (found) {
            const optimisticTask = { ...found, status };
            queryClient.setQueryData<TaskBoardResponse>(boardKey(filters), () => {
              const result = moveTaskBetweenColumns(
                previous,
                id,
                optimisticTask,
                found.status
              );

  return result ?? previous!;
});
          }
        }
        return { previous };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(boardKey(filters), context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(boardKey(filters));
        queryClient.invalidateQueries(['tasks', filters]);
      },
    }
  );
};

export const useAssignTaskMutation = (filters: TasksFilters) => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, assignedToId }: { id: number; assignedToId: number | null }) =>
      assignTask(id, assignedToId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(boardKey(filters));
        queryClient.invalidateQueries(['tasks', filters]);
      },
    }
  );
};
