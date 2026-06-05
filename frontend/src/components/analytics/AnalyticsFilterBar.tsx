import React from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';

import { AnalyticsFilters } from '../../types/analytics';
import { Client } from '../../types/crm';
import { Project, UserSummary } from '../../types/projects';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  clients?: Client[];
  projects?: Project[];
  users?: UserSummary[];
}

const AnalyticsFilterBar = ({ filters, onChange, clients = [], projects = [], users = [] }: AnalyticsFilterBarProps) => {
  const update = (key: keyof AnalyticsFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      <TextField select label="Date range" value={filters.range ?? 'last_30_days'} onChange={(event) => update('range', event.target.value)} sx={{ minWidth: 170 }}>
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="last_7_days">Last 7 days</MenuItem>
        <MenuItem value="last_30_days">Last 30 days</MenuItem>
        <MenuItem value="last_quarter">Last quarter</MenuItem>
        <MenuItem value="custom">Custom</MenuItem>
      </TextField>
      {filters.range === 'custom' ? (
        <>
          <TextField type="date" label="Start" value={filters.start_date ?? ''} onChange={(event) => update('start_date', event.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField type="date" label="End" value={filters.end_date ?? ''} onChange={(event) => update('end_date', event.target.value)} InputLabelProps={{ shrink: true }} />
        </>
      ) : null}
      <TextField select label="Client" value={filters.client ?? ''} onChange={(event) => update('client', event.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="">All clients</MenuItem>
        {clients.map((client) => (
          <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>
        ))}
      </TextField>
      <TextField select label="Project" value={filters.project ?? ''} onChange={(event) => update('project', event.target.value)} sx={{ minWidth: 180 }}>
        <MenuItem value="">All projects</MenuItem>
        {projects.map((project) => (
          <MenuItem key={project.id} value={String(project.id)}>{project.name}</MenuItem>
        ))}
      </TextField>
      <TextField select label="Team member" value={filters.team_member ?? ''} onChange={(event) => update('team_member', event.target.value)} sx={{ minWidth: 200 }}>
        <MenuItem value="">All team</MenuItem>
        {users.map((user) => (
          <MenuItem key={user.id} value={String(user.id)}>{user.email}</MenuItem>
        ))}
      </TextField>
    </Stack>
  );
};

export default AnalyticsFilterBar;
