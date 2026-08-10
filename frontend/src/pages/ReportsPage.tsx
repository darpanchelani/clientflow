import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import RemoveIcon from '@mui/icons-material/Remove';
import SouthEastIcon from '@mui/icons-material/SouthEast';

import AnalyticsFilterBar from '../components/analytics/AnalyticsFilterBar';
import AppPageHeader from '../components/common/AppPageHeader';
import { useClientsQuery } from '../hooks/useClients';
import {
  useAIReportConfigurationQuery,
  useAIReportsQuery,
  useDeleteAIReportMutation,
  useGenerateAIReportMutation,
} from '../hooks/useAnalytics';
import { useProjectsQuery } from '../hooks/useProjects';
import { useUsersQuery } from '../hooks/useUsers';
import { downloadAIReport, downloadReport } from '../services/analyticsApi';
import { AIReport, AIReportType, AnalyticsFilters } from '../types/analytics';
import { getFriendlyErrorMessage } from '../utils/apiError';

const reportTypes: Array<{ value: AIReportType; label: string; description: string }> = [
  { value: 'overview', label: 'Executive overview', description: 'Revenue, pipeline, clients, and delivery in one briefing.' },
  { value: 'revenue', label: 'Revenue and cash flow', description: 'Collections, overdue exposure, and revenue movement.' },
  { value: 'sales', label: 'Sales pipeline', description: 'Lead flow, conversion, and pipeline opportunity.' },
  { value: 'clients', label: 'Client health', description: 'Growth, concentration, and retention signals.' },
  { value: 'delivery', label: 'Project delivery', description: 'Workload, task completion, and schedule risk.' },
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

const directionIcon = {
  up: <NorthEastIcon fontSize="small" />,
  down: <SouthEastIcon fontSize="small" />,
  flat: <RemoveIcon fontSize="small" />,
  neutral: <RemoveIcon fontSize="small" />,
};

const severityColor = {
  positive: 'success' as const,
  info: 'info' as const,
  warning: 'warning' as const,
  critical: 'error' as const,
};

const ReportSkeleton = () => (
  <Stack spacing={3} aria-label="Generating AI report" aria-busy="true">
    <Box>
      <Skeleton width="42%" height={44} />
      <Skeleton width="24%" />
    </Box>
    <Skeleton variant="rounded" height={112} />
    <Grid container spacing={1.5}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Skeleton variant="rounded" height={104} />
        </Grid>
      ))}
    </Grid>
    <Skeleton variant="rounded" height={240} />
  </Stack>
);

const EmptyReport = ({ canGenerate, onGenerate }: { canGenerate: boolean; onGenerate: () => void }) => (
  <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 480, textAlign: 'center', px: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.light', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
      <InsightsOutlinedIcon />
    </Box>
    <Box>
      <Typography variant="h5" gutterBottom>Turn operating data into a briefing</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
        Generate an evidence-backed report with key findings, confidence, and practical next actions.
      </Typography>
    </Box>
    <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={onGenerate} disabled={!canGenerate}>
      Generate first report
    </Button>
  </Stack>
);

const ReportViewer = ({ report, onDownload }: { report: AIReport; onDownload: () => void }) => {
  const [methodOpen, setMethodOpen] = useState(false);
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ xs: 'flex-start', sm: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h2" sx={{ mb: 0.75 }}>{report.title}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">{formatDate(report.period_start)} to {formatDate(report.period_end)}</Typography>
            <Chip size="small" label={`${report.confidence} confidence`} color={report.confidence === 'high' ? 'success' : report.confidence === 'medium' ? 'warning' : 'default'} />
            <Chip size="small" variant="outlined" label={report.model_name} />
          </Stack>
        </Box>
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={onDownload}>Download PDF</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, bgcolor: 'primary.light', borderColor: 'transparent' }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md="auto">
            <Box sx={{ minWidth: 112 }}>
              <Typography variant="caption" color="text.secondary">Business health</Typography>
              <Stack direction="row" alignItems="baseline" spacing={0.5}>
                <Typography variant="h3" sx={{ color: 'primary.dark', fontVariantNumeric: 'tabular-nums' }}>{report.health_score}</Typography>
                <Typography color="text.secondary">/100</Typography>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md>
            <Typography variant="body1" sx={{ lineHeight: 1.75 }}>{report.executive_summary}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Signals that matter</Typography>
        <Grid container spacing={1.5}>
          {report.key_metrics.map((metric) => (
            <Grid item xs={12} sm={6} key={metric.label}>
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                  <Box sx={{ color: metric.direction === 'down' ? 'error.main' : metric.direction === 'up' ? 'success.main' : 'text.secondary' }}>
                    {directionIcon[metric.direction]}
                  </Box>
                </Stack>
                <Typography variant="h5" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>{metric.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{metric.context}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>AI findings</Typography>
        <Stack divider={<Divider flexItem />}>
          {report.findings.map((finding) => (
            <Stack key={`${finding.category}-${finding.title}`} direction="row" spacing={1.5} sx={{ py: 2 }}>
              <Box sx={{ color: `${severityColor[finding.severity]}.main`, pt: 0.25 }}>
                {finding.severity === 'positive' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography fontWeight={700}>{finding.title}</Typography>
                  <Chip size="small" label={finding.category.replace('_', ' ')} color={severityColor[finding.severity]} variant="outlined" />
                </Stack>
                <Typography sx={{ mt: 0.75 }}>{finding.detail}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}><strong>Evidence:</strong> {finding.evidence}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Recommended next actions</Typography>
        <Stack spacing={1}>
          {report.next_actions.map((item, index) => (
            <Stack key={`${item.action}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 3 }}>
              <Typography sx={{ color: 'primary.main', fontWeight: 800, minWidth: 28 }}>{index + 1}</Typography>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" spacing={2} flexWrap="wrap" useFlexGap>
                  <Typography fontWeight={700}>{item.action}</Typography>
                  <Chip size="small" label={item.priority.replace('_', ' ')} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.rationale}</Typography>
                <Typography variant="caption" color="text.secondary">Suggested owner: {item.owner}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box>
        <Button color="inherit" size="small" endIcon={<KeyboardArrowDownIcon sx={{ transform: methodOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease-out' }} />} onClick={() => setMethodOpen((value) => !value)}>
          How this report was generated
        </Button>
        <Collapse in={methodOpen}>
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1, maxWidth: 760 }}>{report.methodology}</Typography>
        </Collapse>
      </Box>
    </Stack>
  );
};

const ReportsPage = () => {
  const [filters, setFilters] = useState<AnalyticsFilters>({ range: 'last_30_days' });
  const [reportType, setReportType] = useState<AIReportType>('overview');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [exportType, setExportType] = useState('revenue');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReportDownloading, setIsReportDownloading] = useState(false);

  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});
  const usersQuery = useUsersQuery();
  const reportsQuery = useAIReportsQuery();
  const configQuery = useAIReportConfigurationQuery();
  const generateMutation = useGenerateAIReportMutation();
  const deleteMutation = useDeleteAIReportMutation();
  const reports = useMemo(() => reportsQuery.data?.results ?? [], [reportsQuery.data?.results]);

  useEffect(() => {
    if (generateMutation.data) setSelectedId(generateMutation.data.id);
  }, [generateMutation.data]);

  useEffect(() => {
    if (selectedId === null && reports.length) setSelectedId(reports[0].id);
  }, [reports, selectedId]);

  const selectedReport = reports.find((report) => report.id === selectedId) ?? generateMutation.data ?? null;
  const selectedType = reportTypes.find((type) => type.value === reportType)!;
  const customRangeInvalid = filters.range === 'custom' && (!filters.start_date || !filters.end_date);
  const canGenerate = Boolean(configQuery.data?.configured) && !generateMutation.isLoading && !customRangeInvalid;

  const handleGenerate = () => generateMutation.mutate({ ...filters, report_type: reportType });

  const handleExport = async () => {
    setIsDownloading(true);
    try {
      await downloadReport({ ...filters, type: exportType, format: exportFormat });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReportDownload = async () => {
    if (!selectedReport) return;
    setIsReportDownloading(true);
    try {
      await downloadAIReport(selectedReport);
    } finally {
      setIsReportDownloading(false);
    }
  };

  const handleDelete = (report: AIReport) => {
    deleteMutation.mutate(report.id, {
      onSuccess: () => setSelectedId((current) => current === report.id ? null : current),
    });
  };

  return (
    <Stack spacing={3}>
      <AppPageHeader
        title="Reports"
        description="Generate decision-ready analysis from live ClientFlow data, then export the underlying records."
        actions={
          <Chip
            icon={configQuery.data?.configured ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
            label={configQuery.isLoading ? 'Checking AI provider' : configQuery.data?.configured ? `OpenAI connected: ${configQuery.data.model}` : 'OpenAI setup required'}
            color={configQuery.data?.configured ? 'success' : 'warning'}
            variant="outlined"
          />
        }
      />

      {!configQuery.isLoading && !configQuery.data?.configured ? (
        <Alert severity="warning">
          Add <strong>OPENAI_API_KEY</strong> to the backend environment to enable genuine AI report generation. Existing data exports remain available.
        </Alert>
      ) : null}
      {generateMutation.isError ? <Alert severity="error">{getFriendlyErrorMessage(generateMutation.error, 'The AI report could not be generated.')}</Alert> : null}

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid item xs={12} lg={3}>
          <Paper variant="outlined" sx={{ p: 2, position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <Stack spacing={2.25}>
              <Box>
                <Typography variant="h6">Build a report</Typography>
                <Typography variant="body2" color="text.secondary">Choose the decision you need to make.</Typography>
              </Box>
              <TextField select fullWidth label="Report focus" value={reportType} onChange={(event) => setReportType(event.target.value as AIReportType)}>
                {reportTypes.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
              </TextField>
              <Typography variant="body2" color="text.secondary">{selectedType.description}</Typography>
              <Divider />
              <AnalyticsFilterBar
                filters={filters}
                onChange={setFilters}
                orientation="vertical"
                clients={clientsQuery.data?.results ?? []}
                projects={projectsQuery.data?.results ?? []}
                users={usersQuery.data ?? []}
              />
              <Button fullWidth size="large" variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleGenerate} disabled={!canGenerate}>
                {generateMutation.isLoading ? 'Analyzing business data' : 'Generate AI report'}
              </Button>
              {generateMutation.isLoading ? <LinearProgress aria-label="Generating report" /> : null}
              <Typography variant="caption" color="text.secondary">Only data visible to your account is included. Generated analysis should be reviewed before financial decisions.</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, minHeight: 620 }}>
            {generateMutation.isLoading ? <ReportSkeleton /> : selectedReport ? <ReportViewer report={selectedReport} onDownload={handleReportDownload} /> : <EmptyReport canGenerate={canGenerate} onGenerate={handleGenerate} />}
            {isReportDownloading ? <LinearProgress sx={{ mt: 2 }} aria-label="Preparing report download" /> : null}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={3}>
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6">Report history</Typography>
                <Typography variant="body2" color="text.secondary">Saved to your workspace</Typography>
              </Box>
              <Divider />
              {reportsQuery.isLoading ? (
                <Stack spacing={1} sx={{ p: 2 }}><Skeleton height={56} /><Skeleton height={56} /><Skeleton height={56} /></Stack>
              ) : reports.length ? (
                <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
                  {reports.map((report) => (
                    <ListItemButton key={report.id} selected={selectedId === report.id} onClick={() => setSelectedId(report.id)} sx={{ alignItems: 'flex-start', py: 1.5, pr: 1 }}>
                      <ListItemText primary={report.title} secondary={`${formatDate(report.created_at)} | ${report.health_score}/100`} primaryTypographyProps={{ variant: 'body2', fontWeight: 700, noWrap: true }} secondaryTypographyProps={{ variant: 'caption' }} />
                      <Tooltip title="Delete report">
                        <IconButton size="small" aria-label={`Delete ${report.title}`} onClick={(event) => { event.stopPropagation(); handleDelete(report); }} disabled={deleteMutation.isLoading}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Generated reports will appear here.</Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6">Data export</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Download the filtered source data without AI analysis.</Typography>
              <Stack spacing={1.5}>
                <TextField select fullWidth label="Dataset" value={exportType} onChange={(event) => setExportType(event.target.value)}>
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="clients">Clients</MenuItem>
                  <MenuItem value="projects">Projects</MenuItem>
                  <MenuItem value="invoices">Invoices</MenuItem>
                </TextField>
                <TextField select fullWidth label="Format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="xlsx">Excel</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                </TextField>
                <Button fullWidth variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={handleExport} disabled={isDownloading || customRangeInvalid}>
                  {isDownloading ? 'Preparing export' : 'Download data'}
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default ReportsPage;
