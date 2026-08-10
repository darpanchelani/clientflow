import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import InvoiceDialog from '../components/billing/InvoiceDialog';
import InvoiceStatusBadge from '../components/billing/InvoiceStatusBadge';
import PaymentHistory from '../components/billing/PaymentHistory';
import AIInlineRecommendation from '../components/ai/AIInlineRecommendation';
import PaymentRiskBadge from '../components/ai/PaymentRiskBadge';
import AppCard from '../components/common/AppCard';
import AppPageHeader from '../components/common/AppPageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import QueryState from '../components/common/QueryState';
import CardSkeleton from '../components/skeletons/CardSkeleton';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useClientsQuery } from '../hooks/useClients';
import {
  useDeleteInvoiceMutation,
  useInvoicePaymentsQuery,
  useInvoiceQuery,
  useSendInvoiceMutation,
  useUpdateInvoiceMutation,
} from '../hooks/useInvoices';
import { useCreatePaymentMutation, useVerifyPaymentMutation } from '../hooks/usePayments';
import { useProjectsQuery } from '../hooks/useProjects';
import { usePaymentRisk } from '../hooks/useAI';
import { InvoiceFormValues, Payment } from '../types/billing';
import { getFriendlyErrorMessage } from '../utils/apiError';

const InvoiceDetailPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const invoiceId = Number(params.invoiceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const confirmDialog = useConfirmDialog();

  const invoiceQuery = useInvoiceQuery(Number.isNaN(invoiceId) ? undefined : invoiceId);
  const paymentRiskQuery = usePaymentRisk(Number.isNaN(invoiceId) ? undefined : invoiceId, !Number.isNaN(invoiceId));
  const paymentsQuery = useInvoicePaymentsQuery(Number.isNaN(invoiceId) ? undefined : invoiceId);
  const clientsQuery = useClientsQuery({});
  const projectsQuery = useProjectsQuery({});

  const updateMutation = useUpdateInvoiceMutation();
  const sendMutation = useSendInvoiceMutation();
  const deleteMutation = useDeleteInvoiceMutation();
  const createPaymentMutation = useCreatePaymentMutation();
  const verifyPaymentMutation = useVerifyPaymentMutation();

  const invoice = invoiceQuery.data;
  const clients = useMemo(() => clientsQuery.data?.results ?? [], [clientsQuery.data]);
  const projects = useMemo(() => projectsQuery.data?.results ?? [], [projectsQuery.data]);

  const dialogClients = useMemo(() => {
    if (!invoice?.client) return clients;
    return clients.some((client) => client.id === invoice.client.id)
      ? clients
      : [invoice.client, ...clients];
  }, [clients, invoice]);

  const dialogProjects = useMemo(() => {
    if (!invoice?.project) return projects;
    return projects.some((project) => project.id === invoice.project?.id)
      ? projects
      : [invoice.project, ...projects];
  }, [invoice, projects]);

  const payments = paymentsQuery.data ?? [];
  const canEdit = invoice?.status === 'draft';

  const handleSave = async (values: InvoiceFormValues) => {
    if (!invoice) return;
    await updateMutation.mutateAsync({ id: invoice.id, payload: values });
    setDialogOpen(false);
  };

  const handleSend = () => {
    if (!invoice) return;
    sendMutation.mutateAsync(invoice.id);
  };

  const handleDelete = () => {
    if (!invoice) return;
    confirmDialog.confirm({
      title: 'Delete invoice',
      message: 'This invoice will be permanently removed.',
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await deleteMutation.mutateAsync(invoice.id);
        navigate('/invoices');
      },
    });
  };

  const handleMarkPaid = () => {
    if (!invoice) return;
    createPaymentMutation.mutateAsync({
      invoice_id: invoice.id,
      amount: invoice.balance_due,
      payment_method: 'stripe_mock',
      status: 'completed',
      transaction_id: `mock-${Date.now()}`,
    });
  };

  const handleVerifyPayment = (payment: Payment) => {
    verifyPaymentMutation.mutateAsync({ id: payment.id, transactionId: `verified-${Date.now()}` });
  };

  if (Number.isNaN(invoiceId)) {
    return <Alert severity="error">Invalid invoice identifier.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Button onClick={() => navigate('/invoices')} sx={{ alignSelf: 'flex-start' }}>
        Back to invoices
      </Button>

      <AppPageHeader
        title={invoice?.invoice_number ?? 'Invoice detail'}
        description="Manage invoice status, payment history, and settlement."
      />

      <QueryState
        isLoading={invoiceQuery.isLoading && !invoice}
        isError={invoiceQuery.isError}
        errorMessage={getFriendlyErrorMessage(invoiceQuery.error)}
        onRetry={() => invoiceQuery.refetch()}
        skeleton="none"
      >
        {invoiceQuery.isLoading && !invoice ? (
          <CardSkeleton count={1} />
        ) : invoice ? (
          <>
            <AppCard>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Client</span>
                    <strong>{invoice.client?.name || 'Not assigned'}</strong>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Project</span>
                    <strong>{invoice.project?.name || 'Not assigned'}</strong>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Balance due</span>
                    <strong>{invoice.balance_due}</strong>
                  </Stack>
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
                <Stack spacing={0.5}>
                  <span>Issue date: {invoice.issue_date}</span>
                  <span>Due date: {invoice.due_date}</span>
                </Stack>
                <Stack spacing={0.5}>
                  <span>Subtotal: {invoice.subtotal}</span>
                  <span>Tax: {invoice.tax}</span>
                  <strong>Total: {invoice.total}</strong>
                </Stack>
              </Stack>

              <p style={{ marginTop: 16, color: '#475569' }}>{invoice.notes || 'No notes added.'}</p>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                <Button variant="outlined" onClick={() => setDialogOpen(true)} disabled={!canEdit}>
                  Edit
                </Button>
                <Button variant="contained" onClick={handleSend} disabled={invoice.status !== 'draft'}>
                  Send Invoice
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleMarkPaid}
                  disabled={invoice.balance_due === '0.00' || invoice.status === 'paid'}
                >
                  Mark as Paid
                </Button>
                <Button variant="outlined" color="error" onClick={handleDelete}>
                  Delete
                </Button>
              </Stack>
            </AppCard>

            <AppCard title="AI Payment Risk" subtitle="Payment delay prediction based on invoice and client payment history.">
              {paymentRiskQuery.isError ? (
                <AIInlineRecommendation
                  title="AI unavailable"
                  recommendation="Payment risk could not be calculated right now. Manual invoice workflows are still available."
                  severity="warning"
                  compact
                />
              ) : paymentRiskQuery.isLoading ? (
                <PaymentRiskBadge loading />
              ) : paymentRiskQuery.data ? (
                <Stack spacing={2}>
                  <PaymentRiskBadge
                    riskScore={paymentRiskQuery.data.risk_score}
                    riskLevel={paymentRiskQuery.data.risk_level}
                    delayProbability={paymentRiskQuery.data.delay_probability}
                    recommendation={paymentRiskQuery.data.recommendation}
                  />
                  <AIInlineRecommendation
                    title={paymentRiskQuery.data.explanation}
                    recommendation={paymentRiskQuery.data.recommendation}
                    severity={paymentRiskQuery.data.risk_level === 'high' ? 'high' : paymentRiskQuery.data.risk_level === 'medium' ? 'warning' : 'info'}
                  />
                </Stack>
              ) : null}
            </AppCard>

            <AppCard title="Line items">
              <Stack sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Invoice line items">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price}</TableCell>
                        <TableCell>{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            </AppCard>
          </>
        ) : null}
      </QueryState>

      <PaymentHistory
        payments={payments}
        loading={paymentsQuery.isLoading}
        onVerify={handleVerifyPayment}
      />

      <InvoiceDialog
        open={dialogOpen}
        clients={dialogClients}
        projects={dialogProjects}
        initialInvoice={invoice}
        loading={updateMutation.isLoading}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      />

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Stack>
  );
};

export default InvoiceDetailPage;
