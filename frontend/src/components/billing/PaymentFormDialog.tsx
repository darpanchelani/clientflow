import React, { useEffect } from 'react';
import { formResolver } from '../../lib/validation/formResolver';
import { Button, Grid, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';

import AppDialog from '../common/AppDialog';
import AppForm from '../common/AppForm';
import FormTextField from '../common/FormTextField';
import LoadingButton from '../common/LoadingButton';
import { paymentFormSchema, PaymentFormData } from '../../lib/validation/schemas';
import { PaymentFormValues } from '../../types/billing';

interface PaymentFormDialogProps {
  open: boolean;
  invoiceId: number;
  maxAmount: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void> | void;
}

const defaultValues: PaymentFormData = {
  amount: '',
  payment_method: 'stripe_mock',
  transaction_id: '',
  status: 'completed',
};

const PaymentFormDialog = ({
  open,
  invoiceId,
  maxAmount,
  loading,
  onClose,
  onSubmit,
}: PaymentFormDialogProps) => {
  const form = useForm<PaymentFormData>({
    resolver: formResolver(paymentFormSchema),
    defaultValues: { ...defaultValues, amount: maxAmount },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (open) {
      form.reset({ ...defaultValues, amount: maxAmount });
    }
  }, [form, maxAmount, open]);

  const handleSubmit = async (values: PaymentFormData) => {
    await onSubmit({
      invoice_id: invoiceId,
      amount: values.amount,
      payment_method: values.payment_method as PaymentFormValues['payment_method'],
      status: values.status as PaymentFormValues['status'],
      transaction_id: values.transaction_id || undefined,
    });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Record payment"
      subtitle="Capture payment details for this invoice."
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="payment-form"
            variant="contained"
            loading={loading}
            loadingLabel="Saving..."
          >
            Record payment
          </LoadingButton>
        </>
      }
    >
      <AppForm form={form} formId="payment-form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormTextField<PaymentFormData>
              name="amount"
              label="Amount"
              type="number"
              fullWidth
              required
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField<PaymentFormData>
              name="payment_method"
              label="Payment method"
              select
              fullWidth
              required
            >
              <MenuItem value="stripe_mock">Stripe (mock)</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="bank_transfer">Bank transfer</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12}>
            <FormTextField<PaymentFormData>
              name="status"
              label="Status"
              select
              fullWidth
              required
            >
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12}>
            <FormTextField<PaymentFormData>
              name="transaction_id"
              label="Transaction ID"
              fullWidth
            />
          </Grid>
        </Grid>
      </AppForm>
    </AppDialog>
  );
};

export default PaymentFormDialog;
