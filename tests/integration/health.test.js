import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns a structured liveness response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('API is running');
    expect(response.body.data).toMatchObject({
      status: 'ok',
      service: 'studio-patron-api',
      environment: 'test',
    });
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('echoes an incoming request id', async () => {
    const response = await request(app).get('/api/v1/health').set('x-request-id', 'client-trace-1');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('client-trace-1');
  });
});
