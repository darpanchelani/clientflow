import { useQuery } from 'react-query';

import { queryKeys } from '../constants/queryKeys';
import { listClients } from '../services/clientsApi';
import { listInvoices } from '../services/invoicesApi';
import { listLeads } from '../services/leadsApi';
import { listProjects } from '../services/projectsApi';
import { listPayments } from '../services/paymentsApi';
import { Invoice } from '../types/billing';
import { Lead } from '../types/crm';

export interface DashboardStats {
  totalLeads: number;
  totalClients: number;
  activeProjects: number;
  openInvoices: number;
  overdueInvoices: Invoice[];
  recentLeads: Lead[];
  leadFunnel: Record<string, number>;
  paymentTotal: number;
  paidInvoices: number;
}

const buildLeadFunnel = (leads: Lead[]) =>
  leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] ?? 0) + 1;
    return acc;
  }, {});

export const useDashboardQuery = () =>
  useQuery(queryKeys.dashboard, async (): Promise<DashboardStats> => {
    const [leadsPage, clientsPage, projectsPage, invoicesPage, paymentsPage] = await Promise.all([
      listLeads({}),
      listClients({}),
      listProjects({}),
      listInvoices({}),
      listPayments({}),
    ]);

    const leads = leadsPage.results;
    const invoices = invoicesPage.results;
    const today = new Date().toISOString().slice(0, 10);

    const overdueInvoices = invoices.filter(
      (invoice) =>
        invoice.status !== 'paid' &&
        invoice.status !== 'cancelled' &&
        invoice.due_date < today
    );

    const paymentTotal = paymentsPage.results
      .filter((payment) => payment.status === 'completed')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return {
      totalLeads: leads.length,
      totalClients: clientsPage.results.length,
      activeProjects: projectsPage.results.filter((project) => project.status === 'active').length,
      openInvoices: invoices.filter((invoice) => invoice.status !== 'paid').length,
      overdueInvoices,
      recentLeads: [...leads]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
      leadFunnel: buildLeadFunnel(leads),
      paymentTotal,
      paidInvoices: invoices.filter((invoice) => invoice.status === 'paid').length,
    };
  }, {
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
