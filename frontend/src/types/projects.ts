export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'user';
  organization_name?: string;
}

export interface ClientSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  lead_id: number | null;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  client: ClientSummary;
  owner: UserSummary;
  status: 'active' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  project: Project;
  assigned_to: UserSummary | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProjectsFilters {
  search?: string;
  status?: string;
  client?: string;
  start_date_after?: string;
  start_date_before?: string;
  end_date_after?: string;
  end_date_before?: string;
  cursor?: string | null;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  client_id: number;
  status: 'active' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
}

export interface TasksFilters {
  project?: number;
  assigned_to?: number | '';
  priority?: string;
  search?: string;
}

export interface TaskBoardResponse {
  todo: Task[];
  in_progress: Task[];
  review: Task[];
  done: Task[];
}

export interface TaskFormValues {
  title: string;
  description: string;
  project_id: number;
  assigned_to_id: number | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
}

