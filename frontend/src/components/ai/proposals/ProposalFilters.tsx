import React from 'react';
import { Grid, MenuItem, TextField } from '@mui/material';

import FilterBar from '../../common/FilterBar';
import { AIProposalFilters } from '../../../types/ai';

interface ProposalFiltersProps {
  filters: AIProposalFilters;
  onChange: (updates: Partial<AIProposalFilters>) => void;
}

const ProposalFilters = ({ filters, onChange }: ProposalFiltersProps) => (
  <FilterBar>
    <Grid item xs={12} md={3}>
      <TextField
        label="Search title/content"
        value={filters.search ?? ''}
        onChange={(event) => onChange({ search: event.target.value, cursor: null })}
        fullWidth
      />
    </Grid>
    <Grid item xs={12} sm={6} md={2}>
      <TextField
        select
        label="Status"
        value={filters.status ?? ''}
        onChange={(event) => onChange({ status: event.target.value, cursor: null })}
        fullWidth
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="draft">Draft</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="sent">Sent</MenuItem>
        <MenuItem value="archived">Archived</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} sm={6} md={2}>
      <TextField
        select
        label="Type"
        value={filters.proposal_type ?? ''}
        onChange={(event) => onChange({ proposal_type: event.target.value, cursor: null })}
        fullWidth
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="service">Service</MenuItem>
        <MenuItem value="project">Project</MenuItem>
        <MenuItem value="retainer">Retainer</MenuItem>
        <MenuItem value="custom">Custom</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} sm={4} md={1.66}>
      <TextField
        label="Lead ID"
        value={filters.lead_id ?? ''}
        onChange={(event) => onChange({ lead_id: event.target.value, cursor: null })}
        fullWidth
      />
    </Grid>
    <Grid item xs={12} sm={4} md={1.66}>
      <TextField
        label="Client ID"
        value={filters.client_id ?? ''}
        onChange={(event) => onChange({ client_id: event.target.value, cursor: null })}
        fullWidth
      />
    </Grid>
    <Grid item xs={12} sm={4} md={1.66}>
      <TextField
        label="Project ID"
        value={filters.project_id ?? ''}
        onChange={(event) => onChange({ project_id: event.target.value, cursor: null })}
        fullWidth
      />
    </Grid>
  </FilterBar>
);

export default ProposalFilters;
