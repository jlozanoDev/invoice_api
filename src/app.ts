import express from 'express';
import { invoicesRouter } from './transport/invoices';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.send('hello world');
  });

  app.use('/api/v1/invoices', invoicesRouter());

  return app;
}
