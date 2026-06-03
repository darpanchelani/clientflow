import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Project } from '../../types/projects';

interface ProjectsState {
  items: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    next: string | null;
    previous: string | null;
  };
}

const initialState: ProjectsState = {
  items: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  pagination: {
    next: null,
    previous: null,
  },
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.items = action.payload;
    },
    upsertProject: (state, action: PayloadAction<Project>) => {
      const index = state.items.findIndex((project) => project.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
      if (state.selectedProject?.id === action.payload.id) {
        state.selectedProject = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((project) => project.id !== action.payload);
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null;
      }
    },
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{ next: string | null; previous: string | null }>
    ) => {
      state.pagination = action.payload;
    },
    clearProjects: (state) => {
      state.items = [];
      state.selectedProject = null;
      state.pagination = { next: null, previous: null };
    },
  },
});

export const {
  setProjects,
  upsertProject,
  removeProject,
  setSelectedProject,
  setLoading,
  setError,
  setPagination,
  clearProjects,
} =
  projectsSlice.actions;

export default projectsSlice.reducer;
