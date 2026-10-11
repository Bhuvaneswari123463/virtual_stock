import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health and Diagnostics API', () => {
  const app = createApp();

  it('GET /api/v1/health returns 200 OK with system statistics', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.environment).toBeDefined();
    expect(res.body.data.system).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/health/ready returns 200 with database readiness state', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe('mongodb');
    expect(['ready', 'not_ready']).toContain(res.body.data.status);
    expect(typeof res.body.data.connected).toBe('boolean');
    expect(res.body.data.message).toBeDefined();
  });

  it('GET non-existent route returns 404 with standardized error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.meta.requestId).toBeDefined();
  });
});
