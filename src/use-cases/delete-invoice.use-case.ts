import type { InvoiceRepository } from '../repositories/invoice.repository';

export interface DeleteInvoiceResultDTO {
  ok: true;
}

export interface DeleteInvoiceErrorDTO {
  ok: false;
  error: string;
  message: string;
}

export function createDeleteInvoiceUseCase(repository: InvoiceRepository) {
  return async (id: string): Promise<DeleteInvoiceResultDTO | DeleteInvoiceErrorDTO> => {
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
        error: 'CONFLICT',
        message: 'No se puede eliminar una factura en estado definitivo',
      };
    }

    await repository.deleteById(id);

    return { ok: true };
  };
}
