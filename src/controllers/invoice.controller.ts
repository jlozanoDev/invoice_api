import type { Request, Response } from 'express';
import type { InvoiceRepository } from '../repositories/invoice.repository';
import { createCreateInvoiceUseCase } from '../use-cases/create-invoice.use-case';
import { createListInvoicesUseCase } from '../use-cases/list-invoices.use-case';
import { createConfirmInvoiceUseCase } from '../use-cases/confirm-invoice.use-case';
import { createGetInvoiceUseCase } from '../use-cases/get-invoice.use-case';
import { createDeleteInvoiceUseCase } from '../use-cases/delete-invoice.use-case';

export function createInvoiceController(repository: InvoiceRepository) {
  const createInvoiceUseCase = createCreateInvoiceUseCase(repository);
  const listInvoicesUseCase = createListInvoicesUseCase(repository);
  const confirmInvoiceUseCase = createConfirmInvoiceUseCase(repository);
  const getInvoiceUseCase = createGetInvoiceUseCase(repository);
  const deleteInvoiceUseCase = createDeleteInvoiceUseCase(repository);

  return {
    async create(req: Request, res: Response) {
      try {
        const result = await createInvoiceUseCase(req.body);

        if (!result.ok) {
          res.status(400).json({ error: result.error, message: result.message });
          return;
        }

        res.status(201).json(result.invoice);
      } catch {
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
      } catch {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },

    async getById(req: Request, res: Response) {
      try {
        const result = await getInvoiceUseCase(req.params.id);

        if (!result.ok) {
          res.status(404).json({ error: result.error, message: result.message });
          return;
        }

        res.status(200).json(result.invoice);
      } catch {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },

    async remove(req: Request, res: Response) {
      try {
        const result = await deleteInvoiceUseCase(req.params.id);

        if (!result.ok) {
          const status = result.error === 'NOT_FOUND' ? 404 : 409;
          res.status(status).json({ error: result.error, message: result.message });
          return;
        }

        res.status(204).end();
      } catch {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },

    async confirm(req: Request, res: Response) {
      try {
        const result = await confirmInvoiceUseCase(req.params.id);

        if (!result.ok) {
          const status = result.error === 'NOT_FOUND' ? 404 : 400;
          res.status(status).json({ error: result.error, message: result.message });
          return;
        }

        res.status(200).json(result.invoice);
      } catch {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        });
      }
    },
  };
}
