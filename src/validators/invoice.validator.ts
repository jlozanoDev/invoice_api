import type { CreateInvoiceInput, ValidationError } from '../types/invoice';

const REQUIRED_FIELDS: (keyof CreateInvoiceInput)[] = [
  'issuer_name', 'issuer_nif', 'issuer_address',
  'client_name', 'client_cif', 'client_address',
  'issue_date', 'operation_date', 'description',
  'base_amount', 'vat_rate', 'vat_amount',
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateCreateInvoice(input: CreateInvoiceInput): ValidationError | null {
  for (const field of REQUIRED_FIELDS) {
    if (input[field] === undefined || input[field] === null) {
      return {
        error: 'VALIDATION_ERROR',
        message: `El campo ${field} es obligatorio`,
      };
    }
  }

  if (typeof input.base_amount !== 'number') {
    return {
      error: 'VALIDATION_ERROR',
      message: 'El campo base_amount debe ser un número',
    };
  }

  if (!DATE_REGEX.test(input.issue_date) || isNaN(Date.parse(input.issue_date))) {
    return {
      error: 'VALIDATION_ERROR',
      message: 'El campo issue_date debe tener formato YYYY-MM-DD',
    };
  }

  return null;
}
