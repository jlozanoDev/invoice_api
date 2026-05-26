import type { InvoiceRepository } from '../repositories/invoice.repository';

export interface ConfirmInvoiceResultDTO {
  ok: true;
  invoice: import('../types/invoice').Invoice;
}

export interface ConfirmInvoiceErrorDTO {
  ok: false;
  error: string;
  message: string;
}

const PREFIX = 'BT';

function padNumber(n: number): string {
  return String(n).padStart(4, '0');
}

export function createConfirmInvoiceUseCase(repository: InvoiceRepository) {
  return async (id: string): Promise<ConfirmInvoiceResultDTO | ConfirmInvoiceErrorDTO> => {
    const invoice = await repository.findById(id);

    if (!invoice) {
      return {
        ok: false,
        error: 'NOT_FOUND',
        message: 'Factura no encontrada',
      };
    }

    if (invoice.status === 'definitivo') {
      return {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'La factura ya está en estado definitivo',
      };
    }

    const definitive = await repository.findAll({ status: 'definitivo', limit: 1 });
    const nextNumber = definitive.pagination.total + 1;

    const updated = await repository.update(id, {
      status: 'definitivo',
      number: `${PREFIX}${padNumber(nextNumber)}`,
      updated_at: new Date().toISOString(),
    });

    return { ok: true, invoice: updated! };
  };
}
