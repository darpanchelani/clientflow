export const queryKeys = {
  leads: (filters: unknown) => ['leads', filters] as const,
  clients: (filters: unknown) => ['clients', filters] as const,
  projects: (filters: unknown) => ['projects', filters] as const,
  project: (id: number) => ['project', id] as const,
  tasks: (projectId: number) => ['tasks', projectId] as const,
  users: ['users'] as const,
  invoices: (filters: unknown) => ['invoices', filters] as const,
  invoice: (id: number) => ['invoice', id] as const,
  invoicePayments: (id: number) => ['invoice-payments', id] as const,
  payments: (filters: unknown) => ['payments', filters] as const,
  dashboard: ['dashboard'] as const,
};
