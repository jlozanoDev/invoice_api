import type { InvoiceRepository, InvoiceFilters, PaginatedResult } from '../repositories/invoice.repository';

export interface ListInvoicesResultDTO {
  ok: true;
  data: PaginatedResult;
}

export interface ListInvoicesErrorDTO {
  ok: false;
  error: string;
  message: string;
}

const VALID_STATUSES = ['borrador', 'definitivo'];

export function createListInvoicesUseCase(repository: InvoiceRepository) {
  return async (query: Record<string, unknown>): Promise<ListInvoicesResultDTO | ListInvoicesErrorDTO> => {
    const limit = query.limit !== undefined ? Number(query.limit) : 20;

    if (limit > 100) {
      return {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'El campo limit no puede ser mayor a 100',
      };
    }

    const status = query.status as string | undefined;
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'El campo status debe ser "borrador" o "definitivo"',
      };
    }

    const filters: InvoiceFilters = {
      status,
      client_cif: query.client_cif as string | undefined,
      client_name: query.client_name as string | undefined,
      issuer_nif: query.issuer_nif as string | undefined,
      number: query.number as string | undefined,
      description: query.description as string | undefined,
      date_from: query.date_from as string | undefined,
      date_to: query.date_to as string | undefined,
      min_base: query.min_base !== undefined ? Number(query.min_base) : undefined,
      max_base: query.max_base !== undefined ? Number(query.max_base) : undefined,
      min_total: query.min_total !== undefined ? Number(query.min_total) : undefined,
      max_total: query.max_total !== undefined ? Number(query.max_total) : undefined,
      sort_by: (query.sort_by as string) || 'created_at',
      sort_order: (query.sort_order as string) || 'desc',
      page: query.page !== undefined ? Number(query.page) : 1,
      limit,
    };

    const result = await repository.findAll(filters);

    return { ok: true, data: result };
  };
}
