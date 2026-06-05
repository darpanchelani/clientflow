import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

const oneOf = <T extends string>(values: readonly T[], message: string) =>
  z.string().refine((value): value is T => (values as readonly string[]).includes(value), message);

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Enter a valid email address',
  });

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^[+]?[\d\s().-]{7,20}$/.test(value),
    'Enter a valid phone number'
  );

export const urlSchema = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
    message: 'URL must start with http:// or https://',
  });

export const currencySchema = z
  .string()
  .trim()
  .refine((value) => value !== '' && !Number.isNaN(Number(value)), 'Enter a valid amount')
  .refine((value) => Number(value) >= 0, 'Amount cannot be negative')
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Use up to 2 decimal places');

export const positiveIntSchema = z.coerce
  .number()
  .int('Must be a whole number')
  .min(0, 'Cannot be negative');

export const requiredDateSchema = z
  .string()
  .trim()
  .min(1, 'Date is required')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date');

export const optionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'Enter a valid date');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  organization_name: z.string().trim().min(2, 'Organization name is required'),
  email: emailSchema,
  password: passwordSchema,
});

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  company: z.string().trim().optional(),
  source: z.string().min(1, 'Source is required'),
  status: z.string().min(1, 'Status is required'),
  score: z.coerce.number().min(0, 'Min score is 0').max(100, 'Max score is 100'),
  tagText: z.string().trim().optional(),
});

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  company: z.string().trim().optional(),
  status: z.string().min(1, 'Status is required'),
  tagText: z.string().trim().optional(),
});

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name is required'),
    description: z.string().trim().optional(),
    client_id: z.number({ error: 'Client is required' }).min(1, 'Client is required'),
    status: oneOf(['active', 'paused', 'completed'], 'Select a valid status'),
    start_date: optionalDateSchema,
    end_date: optionalDateSchema,
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date && data.end_date < data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after start date',
        path: ['end_date'],
      });
    }
  });

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  assigned_to_id: z.preprocess(
    (value) => {
      const normalized = emptyToUndefined(value);
      if (normalized === undefined) return null;
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    },
    z.number().positive().nullable()
  ),
  status: oneOf(['todo', 'in_progress', 'review', 'done'], 'Select a valid status'),
  priority: oneOf(['low', 'medium', 'high', 'urgent'], 'Select a valid priority'),
  due_date: optionalDateSchema,
});

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  quantity: currencySchema,
  unit_price: currencySchema,
});

export const invoiceFormSchema = z
  .object({
    client_id: z.number({ error: 'Client is required' }).min(1, 'Client is required'),
    project_id: z.number().positive().nullable().optional(),
    issue_date: requiredDateSchema,
    due_date: requiredDateSchema,
    notes: z.string().trim().optional(),
    taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate max is 100'),
    items: z.array(invoiceItemSchema).min(1, 'Add at least one line item'),
  })
  .superRefine((data, ctx) => {
    if (data.due_date < data.issue_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date must be on or after issue date',
        path: ['due_date'],
      });
    }
    const subtotal = data.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0
    );
    if (subtotal <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invoice total must be greater than zero',
        path: ['items'],
      });
    }
  });

export const paymentFormSchema = z.object({
  amount: currencySchema,
  payment_method: z.string().trim().min(1, 'Payment method is required'),
  transaction_id: z.string().trim().optional(),
  status: oneOf(['pending', 'completed', 'failed'], 'Select a valid status'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LeadFormData = z.infer<typeof leadFormSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type ProjectFormData = z.infer<typeof projectFormSchema>;
export type TaskFormData = z.infer<typeof taskFormSchema>;
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
