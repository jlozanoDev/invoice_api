import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../app';

let baseUrl: string;
let server: Server;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('POST /api/v1/invoices', () => {
  const validPayload = {
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

  it('should return 201 with created invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    expect(body.status).toBe('borrador');
    expect(body.number).toBeNull();
    expect(body.issuer_name).toBe(validPayload.issuer_name);
    expect(body.issuer_nif).toBe(validPayload.issuer_nif);
    expect(body.issuer_address).toBe(validPayload.issuer_address);
    expect(body.client_name).toBe(validPayload.client_name);
    expect(body.client_cif).toBe(validPayload.client_cif);
    expect(body.client_address).toBe(validPayload.client_address);
    expect(body.issue_date).toBe(validPayload.issue_date);
    expect(body.operation_date).toBe(validPayload.operation_date);
    expect(body.description).toBe(validPayload.description);
    expect(body.base_amount).toBe(validPayload.base_amount);
    expect(body.vat_rate).toBe(validPayload.vat_rate);
    expect(body.vat_amount).toBe(validPayload.vat_amount);
    expect(body.total_amount).toBe(validPayload.base_amount + validPayload.vat_amount);
    expect(body).toHaveProperty('created_at');
    expect(body).toHaveProperty('updated_at');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  it.each([
    'issuer_name',
    'issuer_nif',
    'issuer_address',
    'client_name',
    'client_cif',
    'client_address',
    'issue_date',
    'operation_date',
    'description',
    'base_amount',
    'vat_rate',
    'vat_amount',
  ])('should return 400 when %s is missing', async (field) => {
    const { [field]: _, ...payload } = validPayload;
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(400);
  });

  it('should return 400 when base_amount is not a number', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, base_amount: 'no-un-numero' }),
    });

    expect(res.status).toBe(400);
  });

  it('should return 400 when issue_date has invalid format', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, issue_date: 'invalido' }),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/invoices', () => {
  let invoiceIds: string[];

  beforeAll(async () => {
    const draft1 = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Empresa A S.L.',
        issuer_nif: 'A11111111',
        issuer_address: 'Calle A 1',
        client_name: 'Cliente Alpha',
        client_cif: 'B11111111',
        client_address: 'Av. Alpha 100',
        issue_date: '2026-01-15',
        operation_date: '2026-01-15',
        description: 'Servicios de consultoría - Enero',
        base_amount: 1000.00,
        vat_rate: 21.00,
        vat_amount: 210.00,
      }),
    });
    const d1 = await draft1.json();

    const draft2 = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Empresa B S.L.',
        issuer_nif: 'A22222222',
        issuer_address: 'Calle B 2',
        client_name: 'Cliente Beta',
        client_cif: 'B22222222',
        client_address: 'Av. Beta 200',
        issue_date: '2026-03-20',
        operation_date: '2026-03-20',
        description: 'Servicios de desarrollo - Marzo',
        base_amount: 2000.00,
        vat_rate: 10.00,
        vat_amount: 200.00,
      }),
    });
    const d2 = await draft2.json();

    const draft3 = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Empresa C S.L.',
        issuer_nif: 'A33333333',
        issuer_address: 'Calle C 3',
        client_name: 'Cliente Gamma',
        client_cif: 'B33333333',
        client_address: 'Av. Gamma 300',
        issue_date: '2026-05-10',
        operation_date: '2026-05-10',
        description: 'Servicios de diseño - Mayo',
        base_amount: 3000.00,
        vat_rate: 21.00,
        vat_amount: 630.00,
      }),
    });
    const d3 = await draft3.json();

    const confirmRes = await fetch(`${baseUrl}/api/v1/invoices/${d3.id}/confirm`, {
      method: 'PATCH',
    });
    const confirmed = await confirmRes.json();

    invoiceIds = [d1.id, d2.id, confirmed.id];
  });

  it('should return 200 with paginated list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toHaveProperty('page');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('total');
    expect(body.pagination).toHaveProperty('total_pages');
  });

  it('should filter by status = borrador', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?status=borrador`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.status).toBe('borrador');
    }
  });

  it('should filter by status = definitivo', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?status=definitivo`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.status).toBe('definitivo');
    }
  });

  it('should filter by client_cif (exact match)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?client_cif=B11111111`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.client_cif).toBe('B11111111');
    }
  });

  it('should filter by client_name (partial, case-insensitive)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?client_name=alpha`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.client_name.toLowerCase()).toContain('alpha');
    }
  });

  it('should filter by issuer_nif', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?issuer_nif=A22222222`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.issuer_nif).toBe('A22222222');
    }
  });

  it('should search by description (partial, case-insensitive)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?description=desarrollo`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.description.toLowerCase()).toContain('desarrollo');
    }
  });

  it('should filter by date range (issue_date)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?date_from=2026-02-01&date_to=2026-04-30`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.issue_date >= '2026-02-01').toBe(true);
      expect(inv.issue_date <= '2026-04-30').toBe(true);
    }
  });

  it('should filter by min_base', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?min_base=2000`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.base_amount >= 2000).toBe(true);
    }
  });

  it('should filter by max_base', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?max_base=1500`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.base_amount <= 1500).toBe(true);
    }
  });

  it('should filter by min_total and max_total', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?min_total=500&max_total=2500`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const inv of body.data) {
      expect(inv.total_amount >= 500).toBe(true);
      expect(inv.total_amount <= 2500).toBe(true);
    }
  });

  it('should sort ascending by base_amount', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?sort_by=base_amount&sort_order=asc`);

    expect(res.status).toBe(200);
    const body = await res.json();
    const amounts = body.data.map((inv: any) => inv.base_amount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
    }
  });

  it('should paginate results', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?page=1&limit=2`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(2);
  });

  it('should reject limit above 100', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?limit=200`);

    expect(res.status).toBe(400);
  });

  it('should reject invalid status value', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices?status=invalido`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/invoices/:id', () => {
  let createdId: string;

  beforeAll(async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Test S.L.',
        issuer_nif: 'A99999999',
        issuer_address: 'Calle Test 1',
        client_name: 'Test Client',
        client_cif: 'B99999999',
        client_address: 'Av. Test 500',
        issue_date: '2026-06-01',
        operation_date: '2026-06-01',
        description: 'Test',
        base_amount: 500.00,
        vat_rate: 21.00,
        vat_amount: 105.00,
      }),
    });
    const body = await res.json();
    createdId = body.id;
  });

  it('should return 200 with the invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${createdId}`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdId);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('issuer_name');
    expect(body).toHaveProperty('client_name');
    expect(body).toHaveProperty('base_amount');
    expect(body).toHaveProperty('total_amount');
  });

  it('should return 404 for non-existent invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/00000000-0000-0000-0000-000000000000`);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });
});

describe('DELETE /api/v1/invoices/:id', () => {
  let draftId: string;
  let confirmedId: string;

  beforeAll(async () => {
    const draft = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Delete Test S.L.',
        issuer_nif: 'A88888888',
        issuer_address: 'Calle Delete 1',
        client_name: 'Delete Client',
        client_cif: 'B88888888',
        client_address: 'Av. Delete 500',
        issue_date: '2026-07-01',
        operation_date: '2026-07-01',
        description: 'To delete',
        base_amount: 100.00,
        vat_rate: 21.00,
        vat_amount: 21.00,
      }),
    });
    const d = await draft.json();
    draftId = d.id;

    const toConfirm = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Confirm Test S.L.',
        issuer_nif: 'A77777777',
        issuer_address: 'Calle Confirm 1',
        client_name: 'Confirm Client',
        client_cif: 'B77777777',
        client_address: 'Av. Confirm 500',
        issue_date: '2026-07-02',
        operation_date: '2026-07-02',
        description: 'To confirm and not delete',
        base_amount: 200.00,
        vat_rate: 10.00,
        vat_amount: 20.00,
      }),
    });
    const c = await toConfirm.json();

    const confirmed = await fetch(`${baseUrl}/api/v1/invoices/${c.id}/confirm`, {
      method: 'PATCH',
    });
    const result = await confirmed.json();
    confirmedId = result.id;
  });

  it('should return 204 when deleting a draft invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${draftId}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(204);
  });

  it('should return 404 for non-existent invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(404);
  });

  it('should return 409 when trying to delete a confirmed invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${confirmedId}`, {
      method: 'DELETE',
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });
});

describe('PATCH /api/v1/invoices/:id/confirm', () => {
  let draftId: string;
  let confirmedId: string;

  beforeAll(async () => {
    const draft = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Confirmable S.L.',
        issuer_nif: 'A66666666',
        issuer_address: 'Calle Confirmable 1',
        client_name: 'Confirmable Client',
        client_cif: 'B66666666',
        client_address: 'Av. Confirmable 500',
        issue_date: '2026-08-01',
        operation_date: '2026-08-01',
        description: 'To be confirmed',
        base_amount: 300.00,
        vat_rate: 21.00,
        vat_amount: 63.00,
      }),
    });
    const d = await draft.json();
    draftId = d.id;

    const already = await fetch(`${baseUrl}/api/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issuer_name: 'Already Confirmed S.L.',
        issuer_nif: 'A55555555',
        issuer_address: 'Calle Confirmed 1',
        client_name: 'Confirmed Client',
        client_cif: 'B55555555',
        client_address: 'Av. Confirmed 500',
        issue_date: '2026-08-02',
        operation_date: '2026-08-02',
        description: 'Already confirmed',
        base_amount: 400.00,
        vat_rate: 10.00,
        vat_amount: 40.00,
      }),
    });
    const a = await already.json();

    const confirmRes = await fetch(`${baseUrl}/api/v1/invoices/${a.id}/confirm`, {
      method: 'PATCH',
    });
    const result = await confirmRes.json();
    confirmedId = result.id;
  });

  it('should return 200 and set status definitivo with number', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${draftId}/confirm`, {
      method: 'PATCH',
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(draftId);
    expect(body.status).toBe('definitivo');
    expect(body.number).toBeTruthy();
  });

  it('should return 400 when invoice is already definitive', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/${confirmedId}/confirm`, {
      method: 'PATCH',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  it('should return 404 for non-existent invoice', async () => {
    const res = await fetch(`${baseUrl}/api/v1/invoices/00000000-0000-0000-0000-000000000000/confirm`, {
      method: 'PATCH',
    });

    expect(res.status).toBe(404);
  });
});
