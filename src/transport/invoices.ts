import { Router } from 'express';
import type { InvoiceRepository } from '../repositories/invoice.repository';
import { inMemoryInvoiceRepository } from '../repositories/invoice.repository';
import { createInvoiceController } from '../controllers/invoice.controller';

export function invoicesRouter(repository?: InvoiceRepository) {
  const router = Router();
  const repo = repository ?? inMemoryInvoiceRepository();
  const controller = createInvoiceController(repo);

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.delete('/:id', controller.remove);
  router.post('/', controller.create);
  router.patch('/:id/confirm', controller.confirm);

  return router;
}
