import 'dotenv/config';
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'invoice_api';

const MAX_ATTEMPTS = 10;

for (let i = 1; i <= MAX_ATTEMPTS; i++) {
  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`Database "${database}" ready.`);
    await conn.end();
    process.exit(0);
  } catch (err) {
    if (i < MAX_ATTEMPTS) {
      console.log(`Waiting for MySQL (attempt ${i}/${MAX_ATTEMPTS})...`);
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.error('MySQL not available after', MAX_ATTEMPTS, 'attempts');
      throw err;
    }
  }
}
