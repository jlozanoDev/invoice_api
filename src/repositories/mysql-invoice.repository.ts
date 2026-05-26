import mysql from 'mysql2/promise';
import type { Invoice } from '../types/invoice';
import type { InvoiceRepository, InvoiceFilters, PaginatedResult } from './invoice.repository';

const PREFIX = 'BT';

function buildWhereClause(filters: InvoiceFilters): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) { conditions.push('status = ?'); params.push(filters.status); }
  if (filters.client_cif) { conditions.push('client_cif = ?'); params.push(filters.client_cif); }
  if (filters.client_name) { conditions.push('LOWER(client_name) LIKE ?'); params.push(`%${filters.client_name.toLowerCase()}%`); }
  if (filters.issuer_nif) { conditions.push('issuer_nif = ?'); params.push(filters.issuer_nif); }
  if (filters.number) { conditions.push('number = ?'); params.push(filters.number); }
  if (filters.description) { conditions.push('LOWER(description) LIKE ?'); params.push(`%${filters.description.toLowerCase()}%`); }
  if (filters.date_from) { conditions.push('issue_date >= ?'); params.push(filters.date_from); }
  if (filters.date_to) { conditions.push('issue_date <= ?'); params.push(filters.date_to); }
  if (filters.min_base !== undefined) { conditions.push('base_amount >= ?'); params.push(filters.min_base); }
  if (filters.max_base !== undefined) { conditions.push('base_amount <= ?'); params.push(filters.max_base); }
  if (filters.min_total !== undefined) { conditions.push('total_amount >= ?'); params.push(filters.min_total); }
  if (filters.max_total !== undefined) { conditions.push('total_amount <= ?'); params.push(filters.max_total); }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

const DATETIME_FIELDS = new Set<keyof Invoice>(['created_at', 'updated_at']);

function toMysqlDatetime(iso: string): string {
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

function prepareInvoiceData(data: Partial<Invoice>): Partial<Invoice> {
  const prepared = { ...data };
  for (const field of DATETIME_FIELDS) {
    const val = prepared[field];
    if (typeof val === 'string') {
      (prepared as any)[field] = toMysqlDatetime(val);
    }
  }
  return prepared;
}

function rowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    issuer_name: row.issuer_name,
    issuer_nif: row.issuer_nif,
    issuer_address: row.issuer_address,
    client_name: row.client_name,
    client_cif: row.client_cif,
    client_address: row.client_address,
    issue_date: row.issue_date instanceof Date ? row.issue_date.toISOString().slice(0, 10) : row.issue_date,
    operation_date: row.operation_date instanceof Date ? row.operation_date.toISOString().slice(0, 10) : row.operation_date,
    description: row.description,
    base_amount: Number(row.base_amount),
    vat_rate: Number(row.vat_rate),
    vat_amount: Number(row.vat_amount),
    total_amount: Number(row.total_amount),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

const ALLOWED_SORT_COLUMNS = new Set([
  'created_at', 'updated_at', 'issue_date', 'base_amount', 'total_amount',
  'client_name', 'issuer_name', 'status', 'number',
]);

let pool: mysql.Pool | null = null;

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'invoice_api',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export function createMysqlInvoiceRepository(): InvoiceRepository {
  const pool = getPool();
  return {
    async save(invoice) {
      const data = prepareInvoiceData(invoice);
      const sql = `INSERT INTO invoices (
        id, number, status,
        issuer_name, issuer_nif, issuer_address,
        client_name, client_cif, client_address,
        issue_date, operation_date, description,
        base_amount, vat_rate, vat_amount, total_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      await pool.execute(sql, [
        data.id, data.number, data.status,
        data.issuer_name, data.issuer_nif, data.issuer_address,
        data.client_name, data.client_cif, data.client_address,
        data.issue_date, data.operation_date, data.description,
        data.base_amount, data.vat_rate, data.vat_amount, data.total_amount,
        data.created_at, data.updated_at,
      ] as any[]);

      return invoice;
    },

    async findById(id) {
      const [rows] = await pool.execute<any[]>('SELECT * FROM invoices WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      return rowToInvoice(rows[0]);
    },

    async findAll(filters = {}) {
      const { clause, params } = buildWhereClause(filters);

      const countSql = `SELECT COUNT(*) AS total FROM invoices ${clause}`;
      const [countRows] = await pool.query<any[]>(countSql, params);
      const total = countRows[0].total;

      const sortBy = filters.sort_by && ALLOWED_SORT_COLUMNS.has(filters.sort_by) ? filters.sort_by : 'created_at';
      const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      const dataSql = `SELECT * FROM invoices ${clause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
      const [dataRows] = await pool.query<any[]>(dataSql, [...params, limit, offset]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: dataRows.map(rowToInvoice),
        pagination: { page, limit, total, total_pages: totalPages },
      };
    },

    async deleteById(id) {
      const [result] = await pool.execute<any>('DELETE FROM invoices WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    async update(id, data) {
      const prepared = prepareInvoiceData(data);
      const fields = Object.keys(prepared) as (keyof Invoice)[];
      if (fields.length === 0) return null;

      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => prepared[f]);

      const sql = `UPDATE invoices SET ${setClause} WHERE id = ?`;
      const [result] = await pool.execute<any>(sql, [...values, id] as any[]);

      if (result.affectedRows === 0) return null;

      return this.findById(id);
    },

    async getNextInvoiceNumber() {
      const [rows] = await pool.execute<any[]>('SELECT MAX(CAST(SUBSTRING(number, 3) AS UNSIGNED)) AS max_num FROM invoices WHERE number IS NOT NULL');
      const nextNum = (rows[0].max_num || 0) + 1;
      return `${PREFIX}${String(nextNum).padStart(4, '0')}`;
    },
  };
}
