export interface Invoice {
  id: string;
  number: string | null;
  status: 'borrador' | 'definitivo';
  issuer_name: string;
  issuer_nif: string;
  issuer_address: string;
  client_name: string;
  client_cif: string;
  client_address: string;
  issue_date: string;
  operation_date: string;
  description: string;
  base_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  issuer_name: string;
  issuer_nif: string;
  issuer_address: string;
  client_name: string;
  client_cif: string;
  client_address: string;
  issue_date: string;
  operation_date: string;
  description: string;
  base_amount: number;
  vat_rate: number;
  vat_amount: number;
}

export interface ValidationError {
  error: string;
  message: string;
}
