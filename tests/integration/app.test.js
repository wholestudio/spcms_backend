import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('OpenAPI documentation', () => {
  it('serves Swagger UI at /api/docs', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/swagger/i);
  });
});

describe('application startup', () => {
  it('creates an Express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });
});
