import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createMysqlTestServer, truncateInvoices } from './helpers/mysql-test-server';
import type { MysqlTestServer } from './helpers/mysql-test-server';

let ts: MysqlTestServer;

beforeAll(async () => {
  ts = await createMysqlTestServer();
});

afterAll(async () => {
  await ts.cleanup();
});

beforeEach(async () => {
  await truncateInvoices();
});

describe('POST /api/v1/invoices (MySQL)', () => {
  const valid = {
    issuer_name: 'Mi Empresa S.L.',
    issuer_nif: 'A12345678',
    issuer_address: 'Calle Mayor 1, 28001 Madrid',
    client_name: 'Cliente S.A.',
    client_cif: 'B12345678',
    client_address: 'Av. Principal 100, 08001 Barcelona',
    issue_date: '2026-05-25',
    operation_date: '2026-05-25',
    description: 'Servicios de consultoría - Mayo 2026',
    base_amount: 100.00,
    vat_rate: 21.00,
    vat_amount: 21.00,
  };

  it('should create invoice and compute total', async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('borrador');
    expect(body.number).toBeNull();
    expect(body.total_amount).toBe(121.00);
  });

  it('should return 400 for missing fields', async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/invoices/:id/confirm (MySQL)', () => {
  let invoiceId: string;

  beforeEach(async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Emitente S.L.',
        issuer_nif: 'C87654321',
        issuer_address: 'C/ Falsa 123',
        client_name: 'Comprador S.A.',
        client_cif: 'D87654321',
        client_address: 'Av. Real 456',
        issue_date: '2026-06-01',
        operation_date: '2026-06-01',
        description: 'Servicio de prueba',
        base_amount: 500,
        vat_rate: 10,
        vat_amount: 50,
      }),
    });
    invoiceId = (await res.json()).id;
  });

  it('should assign sequential BT numbers', async () => {
    const r1 = await fetch(`${ts.baseUrl}/api/v1/invoices/${invoiceId}/confirm`, { method: 'PATCH' });
    expect(r1.status).toBe(200);
    const b1 = await r1.json();
    expect(b1.number).toBe('BT0001');
    expect(b1.status).toBe('definitivo');

    const res2 = await fetch(`${ts.baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Emitente S.L.',
        issuer_nif: 'C87654321',
        issuer_address: 'C/ Falsa 123',
        client_name: 'Comprador S.A.',
        client_cif: 'D87654321',
        client_address: 'Av. Real 456',
        issue_date: '2026-06-02',
        operation_date: '2026-06-02',
        description: 'Segundo servicio',
        base_amount: 200,
        vat_rate: 21,
        vat_amount: 42,
      }),
    });
    const secondId = (await res2.json()).id;

    const r2 = await fetch(`${ts.baseUrl}/api/v1/invoices/${secondId}/confirm`, { method: 'PATCH' });
    expect(r2.status).toBe(200);
    const b2 = await r2.json();
    expect(b2.number).toBe('BT0002');
  });
});

describe('DELETE /api/v1/invoices/:id (MySQL)', () => {
  let draftId: string;

  beforeEach(async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Emitente S.L.',
        issuer_nif: 'C87654321',
        issuer_address: 'C/ Falsa 123',
        client_name: 'Comprador S.A.',
        client_cif: 'D87654321',
        client_address: 'Av. Real 456',
        issue_date: '2026-06-01',
        operation_date: '2026-06-01',
        description: 'Para borrar',
        base_amount: 100,
        vat_rate: 21,
        vat_amount: 21,
      }),
    });
    draftId = (await res.json()).id;
  });

  it('should delete draft and return 204', async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices/${draftId}`, { method: 'DELETE' });
    expect(res.status).toBe(204);

    const getRes = await fetch(`${ts.baseUrl}/api/v1/invoices/${draftId}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 409 when trying to delete confirmed invoice', async () => {
    await fetch(`${ts.baseUrl}/api/v1/invoices/${draftId}/confirm`, { method: 'PATCH' });
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices/${draftId}`, { method: 'DELETE' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/invoices (MySQL)', () => {
  it('should return empty list', async () => {
    const res = await fetch(`${ts.baseUrl}/api/v1/invoices`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });
});
