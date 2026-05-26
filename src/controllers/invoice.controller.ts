import type { Request, Response } from 'express';
import type { InvoiceRepository } from '../repositories/invoice.repository';
import { createCreateInvoiceUseCase } from '../use-cases/create-invoice.use-case';
import { createListInvoicesUseCase } from '../use-cases/list-invoices.use-case';

export function createInvoiceController(repository: InvoiceRepository) {
  const createInvoiceUseCase = createCreateInvoiceUseCase(repository);
  const listInvoicesUseCase = createListInvoicesUseCase(repository);

  return {
    async create(req: Request, res: Response) {
      try {
        const result = await createInvoiceUseCase(req.body);

        if (!result.ok) {
          res.status(400).json({ error: result.error, message: result.message });
          return;
        }

        res.status(201).json(result.invoice);
      } catch (error) {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },

    async list(req: Request, res: Response) {
      try {
        const query = req.query as Record<string, unknown>;
        const result = await listInvoicesUseCase(query);

        if (!result.ok) {
          res.status(400).json({ error: result.error, message: result.message });
          return;
        }

        res.status(200).json(result.data);
      } catch (error) {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },
  };
}
