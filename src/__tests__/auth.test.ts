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

describe('GET /api/v1/protected', () => {
  it('should return 401 when no auth header', async () => {
    const res = await fetch(`${baseUrl}/api/v1/protected`);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  it('should return 401 when auth header is not Bearer', async () => {
    const res = await fetch(`${baseUrl}/api/v1/protected`, {
      headers: { Authorization: 'Basic token' },
    });

    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await fetch(`${baseUrl}/api/v1/protected`, {
      headers: { Authorization: 'Bearer token-invalido' },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });

  it('should return 200 when token is valid', async () => {
    const res = await fetch(`${baseUrl}/api/v1/protected`, {
      headers: { Authorization: 'Bearer supersecreto' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });
});
