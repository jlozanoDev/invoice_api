import type { Invoice } from '../types/invoice';

export interface InvoiceFilters {
  status?: string;
  client_cif?: string;
  client_name?: string;
  issuer_nif?: string;
  number?: string;
  description?: string;
  date_from?: string;
  date_to?: string;
  min_base?: number;
  max_base?: number;
  min_total?: number;
  max_total?: number;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface InvoiceRepository {
  save(invoice: Invoice): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findAll(filters?: InvoiceFilters): Promise<PaginatedResult>;
  deleteById(id: string): Promise<boolean>;
  update(id: string, data: Partial<Invoice>): Promise<Invoice | null>;
  getNextInvoiceNumber(): Promise<string>;
}

const PREFIX = 'BT';
let nextNumber = 1;
const invoices: Invoice[] = [];

function matchesFilters(invoice: Invoice, filters: InvoiceFilters): boolean {
  if (filters.status && invoice.status !== filters.status) return false;
  if (filters.client_cif && invoice.client_cif !== filters.client_cif) return false;
  if (filters.client_name && !invoice.client_name.toLowerCase().includes(filters.client_name.toLowerCase())) return false;
  if (filters.issuer_nif && invoice.issuer_nif !== filters.issuer_nif) return false;
  if (filters.number && invoice.number !== filters.number) return false;
  if (filters.description && !invoice.description.toLowerCase().includes(filters.description.toLowerCase())) return false;
  if (filters.date_from && invoice.issue_date < filters.date_from) return false;
  if (filters.date_to && invoice.issue_date > filters.date_to) return false;
  if (filters.min_base !== undefined && invoice.base_amount < filters.min_base) return false;
  if (filters.max_base !== undefined && invoice.base_amount > filters.max_base) return false;
  if (filters.min_total !== undefined && invoice.total_amount < filters.min_total) return false;
  if (filters.max_total !== undefined && invoice.total_amount > filters.max_total) return false;
  return true;
}

export function inMemoryInvoiceRepository(): InvoiceRepository {
  return {
    async save(invoice) {
      invoices.push(invoice);
      return invoice;
    },

    async findById(id) {
      return invoices.find((inv) => inv.id === id) ?? null;
    },

    async findAll(filters = {}) {
      let filtered = invoices.filter((inv) => matchesFilters(inv, filters));

      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order === 'asc' ? 1 : -1;
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        if (aVal < bVal) return -1 * sortOrder;
        if (aVal > bVal) return 1 * sortOrder;
        return 0;
      });

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);

      return {
        data,
        pagination: { page, limit, total, total_pages: totalPages },
      };
    },

    async deleteById(id) {
      const index = invoices.findIndex((inv) => inv.id === id);
      if (index === -1) return false;
      invoices.splice(index, 1);
      return true;
    },

    async update(id, data) {
      const index = invoices.findIndex((inv) => inv.id === id);
      if (index === -1) return null;
      invoices[index] = { ...invoices[index], ...data };
      return invoices[index];
    },

    async getNextInvoiceNumber() {
      const number = `${PREFIX}${String(nextNumber).padStart(4, '0')}`;
      nextNumber++;
      return number;
    },
  };
}
