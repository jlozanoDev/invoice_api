import crypto from 'node:crypto';
import type { Invoice, CreateInvoiceInput } from '../types/invoice';
import type { InvoiceRepository } from '../repositories/invoice.repository';
import { validateCreateInvoice } from '../validators/invoice.validator';

export interface CreateInvoiceResultDTO {
  ok: true;
  invoice: Invoice;
}

export interface CreateInvoiceErrorDTO {
  ok: false;
  error: string;
  message: string;
}

export function createCreateInvoiceUseCase(repository: InvoiceRepository) {
  return async (input: CreateInvoiceInput): Promise<CreateInvoiceResultDTO | CreateInvoiceErrorDTO> => {
    const validationError = validateCreateInvoice(input);
    if (validationError) {
      return { ok: false, ...validationError };
    }

    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      number: null,
      status: 'borrador',
      ...input,
      total_amount: input.base_amount + input.vat_amount,
      created_at: now,
      updated_at: now,
    };

    await repository.save(invoice);

    return { ok: true, invoice };
  };
}
