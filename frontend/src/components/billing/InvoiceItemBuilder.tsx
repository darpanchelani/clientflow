import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import FormTextField from '../common/FormTextField';
import { InvoiceFormData } from '../../lib/validation/schemas';

interface InvoiceItemBuilderProps {
  disabled?: boolean;
}

const toNumber = (value: string) => Number.parseFloat(value || '0') || 0;

const InvoiceItemBuilder = ({ disabled }: InvoiceItemBuilderProps) => {
  const { control } = useFormContext<InvoiceFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item?.quantity ?? '0') * toNumber(item?.unit_price ?? '0'),
    0
  );

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6" fontWeight={700}>
          Invoice items
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Build the line items that make up the invoice.
        </Typography>
      </Box>
      <Stack spacing={2}>
        {fields.map((field, index) => {
          const item = items[index];
          const total = toNumber(item?.quantity ?? '0') * toNumber(item?.unit_price ?? '0');
          return (
            <Paper key={field.id} sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600}>Item {index + 1}</Typography>
                  <IconButton
                    disabled={disabled || fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormTextField<InvoiceFormData>
                    name={`items.${index}.description`}
                    label="Description"
                    fullWidth
                    required
                    disabled={disabled}
                  />
                  <FormTextField<InvoiceFormData>
                    name={`items.${index}.quantity`}
                    label="Quantity"
                    type="number"
                    fullWidth
                    disabled={disabled}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                  <FormTextField<InvoiceFormData>
                    name={`items.${index}.unit_price`}
                    label="Unit price"
                    type="number"
                    fullWidth
                    disabled={disabled}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                  <TextField
                    label="Line total"
                    value={total.toFixed(2)}
                    fullWidth
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          onClick={() => append({ description: '', quantity: '1', unit_price: '0.00' })}
          disabled={disabled}
        >
          Add item
        </Button>
        <Typography fontWeight={700}>Subtotal: {subtotal.toFixed(2)}</Typography>
      </Stack>
    </Stack>
  );
};

export default InvoiceItemBuilder;
