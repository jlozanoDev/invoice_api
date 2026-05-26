import type { InvoiceRepository } from '../repositories/invoice.repository';
import type { Invoice } from '../types/invoice';

export interface GetInvoiceResultDTO {
  ok: true;
  invoice: Invoice;
}

export interface GetInvoiceErrorDTO {
  ok: false;
  error: string;
  message: string;
}

export function createGetInvoiceUseCase(repository: InvoiceRepository) {
  return async (id: string): Promise<GetInvoiceResultDTO | GetInvoiceErrorDTO> => {
    const invoice = await repository.findById(id);

    if (!invoice) {
      return {
        ok: false,
        error: 'NOT_FOUND',
        message: 'Factura no encontrada',
      };
    }

    return { ok: true, invoice };
  };
}
