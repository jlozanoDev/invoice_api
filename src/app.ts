import express from 'express';
import type { InvoiceRepository } from './repositories/invoice.repository';
import { invoicesRouter } from './transport/invoices';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';

export function createApp(repository?: InvoiceRepository) {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use('/api/v1/invoices', invoicesRouter(repository));

  app.get('/api/v1/protected', authMiddleware, (_req, res) => {
    res.json({ message: 'Acceso autorizado' });
  });

  return app;
}
