import 'dotenv/config';
import mysql from 'mysql2/promise';
import type { Server } from 'node:http';
import { createApp } from '../../app';
import {
  createMysqlInvoiceRepository,
  closeDbPool,
} from '../../repositories/mysql-invoice.repository';

function getBaseDbName(): string {
  return process.env.DB_NAME || 'invoice_api';
}

const TEST_DB_SUFFIX = '_test';

function getConnectionConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
}

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    number VARCHAR(20) NULL,
    status ENUM('borrador', 'definitivo') NOT NULL DEFAULT 'borrador',
    issuer_name VARCHAR(255) NOT NULL,
    issuer_nif VARCHAR(20) NOT NULL,
    issuer_address TEXT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_cif VARCHAR(20) NOT NULL,
    client_address TEXT NOT NULL,
    issue_date DATE NOT NULL,
    operation_date DATE NOT NULL,
    description TEXT NOT NULL,
    base_amount DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    vat_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_status (status),
    INDEX idx_client_cif (client_cif),
    INDEX idx_issue_date (issue_date)
  )
`;

let _testDbName: string | null = null;

export interface MysqlTestServer {
  baseUrl: string;
  server: Server;
  cleanup: () => Promise<void>;
}

export async function createMysqlTestServer(): Promise<MysqlTestServer> {
  _testDbName = getBaseDbName() + TEST_DB_SUFFIX;
  const cfg = getConnectionConfig();
  const originalDbName = process.env.DB_NAME;

  const rootConn = await mysql.createConnection(cfg);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${_testDbName}\``);
  await rootConn.end();

  const dbConn = await mysql.createConnection({ ...cfg, database: _testDbName });
  await dbConn.query(CREATE_TABLE_SQL);
  await dbConn.end();

  process.env.DB_NAME = _testDbName;

  const repository = createMysqlInvoiceRepository();
  const app = createApp(repository);

  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const addr = server.address();
  const baseUrl = `http://localhost:${addr && typeof addr === 'object' ? addr.port : 0}`;

  return {
    baseUrl,
    server,
    async cleanup() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await closeDbPool();
      process.env.DB_NAME = originalDbName;
      _testDbName = null;
    },
  };
}

export async function truncateInvoices(): Promise<void> {
  if (!_testDbName) throw new Error('Test server not initialized');
  const cfg = getConnectionConfig();
  const conn = await mysql.createConnection({ ...cfg, database: _testDbName });
  await conn.query('TRUNCATE TABLE invoices');
  await conn.end();
}
