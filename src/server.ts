import 'dotenv/config';
import { createApp } from './app';
import { createMysqlInvoiceRepository } from './repositories/mysql-invoice.repository';

const repository = createMysqlInvoiceRepository();
const app = createApp(repository);
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
