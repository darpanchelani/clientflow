import React, { useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

export type SortDirection = 'asc' | 'desc';

export interface AppTableColumn<T> {
  id: string;
  label: string;
  sortable?: boolean;
  hideable?: boolean;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  render: (row: T) => React.ReactNode;
  getSortValue?: (row: T) => string | number;
}

interface AppTableProps<T> {
  rows: T[];
  columns: AppTableColumn<T>[];
  rowKey: (row: T) => string | number;
  searchPlaceholder?: string;
  searchable?: (row: T, query: string) => boolean;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
}

function AppTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = 'Search…',
  searchable,
  emptyState,
  toolbar,
}: AppTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column.id)),
    [columns, hiddenColumns]
  );

  const filteredRows = useMemo(() => {
    let next = rows;
    if (query && searchable) {
      next = next.filter((row) => searchable(row, query.toLowerCase()));
    }
    if (sortBy) {
      const column = columns.find((item) => item.id === sortBy);
      if (column?.getSortValue) {
        next = [...next].sort((a, b) => {
          const left = column.getSortValue!(a);
          const right = column.getSortValue!(b);
          if (left < right) return sortDirection === 'asc' ? -1 : 1;
          if (left > right) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }
    return next;
  }, [columns, query, rows, searchable, sortBy, sortDirection]);

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(columnId);
    setSortDirection('asc');
  };

  const toggleColumn = (columnId: string) => {
    setHiddenColumns((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId]
    );
  };

  return (
    <Paper>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ p: 2 }}
      >
        {searchable ? (
          <TextField
            size="small"
            label={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ minWidth: { sm: 240 } }}
            inputProps={{ 'aria-label': 'Table search' }}
          />
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
        {toolbar}
        <IconButton
          aria-label="Toggle column visibility"
          onClick={(event) => setColumnMenuAnchor(event.currentTarget)}
        >
          <ViewColumnIcon />
        </IconButton>
      </Stack>

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
      >
        {columns
          .filter((column) => column.hideable !== false)
          .map((column) => (
            <MenuItem key={column.id} dense>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!hiddenColumns.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                  />
                }
                label={column.label}
              />
            </MenuItem>
          ))}
      </Menu>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label="Data table">
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell key={column.id} align={column.align} sx={{ minWidth: column.minWidth }}>
                  {column.sortable && column.getSortValue ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={rowKey(row)} hover>
                {visibleColumns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length}>
                  {emptyState ?? (
                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                      No records found.
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default AppTable;
