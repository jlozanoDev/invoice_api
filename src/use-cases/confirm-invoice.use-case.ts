import type { InvoiceRepository } from '../repositories/invoice.repository';
import type { Invoice } from '../types/invoice';

export interface ConfirmInvoiceResultDTO {
  ok: true;
  invoice: Invoice;
}

export interface ConfirmInvoiceErrorDTO {
  ok: false;
  error: string;
  message: string;
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

    const number = await repository.getNextInvoiceNumber();

    const updated = await repository.update(id, {
      status: 'definitivo',
      number,
      updated_at: new Date().toISOString(),
    });

    return { ok: true, invoice: updated! };
  };
}
