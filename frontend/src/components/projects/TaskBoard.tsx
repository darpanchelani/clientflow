import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { Task, TaskBoardResponse } from '../../types/projects';

interface TaskBoardProps {
  board: TaskBoardResponse;
  onMoveTask: (taskId: number, status: Task['status']) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
}

const columns: Array<{ key: keyof TaskBoardResponse; title: string }> = [
  { key: 'todo', title: 'Todo' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'review', title: 'Review' },
  { key: 'done', title: 'Done' },
];

const priorityColor: Record<Task['priority'], 'default' | 'error' | 'warning' | 'info' | 'success'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

const TaskBoard = ({ board, onMoveTask, onEditTask, onDeleteTask }: TaskBoardProps) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, task: Task) => {
    event.dataTransfer.setData('application/task-id', String(task.id));
    event.dataTransfer.setData('application/task-status', task.status);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData('application/task-id'));
    const sourceStatus = event.dataTransfer.getData('application/task-status');
    if (!taskId || sourceStatus === status) {
      return;
    }
    onMoveTask(taskId, status);
  };

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={2}
      alignItems="stretch"
      role="region"
      aria-label="Task board"
    >
      {columns.map((column) => {
        const tasks = board[column.key];
        return (
          <Paper
            key={column.key}
            sx={{
              flex: 1,
              p: 2,
              minHeight: { xs: 280, md: 480 },
              bgcolor: 'background.paper',
              minWidth: { lg: 220 },
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column.key as Task['status'])}
            aria-label={`${column.title} column`}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {column.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tasks.length} tasks
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {tasks.map((task) => (
                  <Paper
                    key={task.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, task)}
                    sx={{
                      p: 1.5,
                      cursor: 'grab',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                    role="article"
                    aria-label={`Task: ${task.title}`}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography fontWeight={700}>{task.title}</Typography>
                        <Chip
                          size="small"
                          label={task.priority}
                          color={priorityColor[task.priority]}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {task.description || 'No description'}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {task.assigned_to ? task.assigned_to.email : 'Unassigned'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.due_date || 'No due date'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="flex-end">
                        <Chip
                          size="small"
                          label="Edit"
                          onClick={() => onEditTask(task)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onEditTask(task);
                            }
                          }}
                          tabIndex={0}
                          sx={{ cursor: 'pointer' }}
                        />
                        {onDeleteTask ? (
                          <Chip
                            size="small"
                            label="Delete"
                            onClick={() => onDeleteTask(task.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onDeleteTask(task.id);
                              }
                            }}
                            tabIndex={0}
                            sx={{ cursor: 'pointer', ml: 1 }}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                {tasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Drop tasks here
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default TaskBoard;
