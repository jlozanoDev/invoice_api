import { Router } from 'express';
import { inMemoryInvoiceRepository } from '../repositories/invoice.repository';
import { createInvoiceController } from '../controllers/invoice.controller';

export function invoicesRouter() {
  const router = Router();
  const repository = inMemoryInvoiceRepository();
  const controller = createInvoiceController(repository);

  router.get('/', controller.list);
  router.post('/', controller.create);

  return router;
}
