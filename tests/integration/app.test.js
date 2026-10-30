import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('OpenAPI documentation', () => {
  it('serves Swagger UI at /api/docs', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/swagger/i);
  });

  it('serves OpenAPI 1.1 JSON including health and auth', async () => {
    const response = await request(app).get('/api/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.version).toBe('1.1.0');
    expect(response.body.paths['/api/v1/health']).toBeDefined();
    expect(response.body.paths['/api/v1/admin/auth/login']).toBeDefined();
    expect(response.body.paths['/api/v1/admin/auth/session']).toBeDefined();
    expect(response.body.components.securitySchemes.cookieAuth).toBeDefined();
    expect(response.body.components.securitySchemes.bearerAuth).toBeDefined();
  });
});

describe('application startup', () => {
  it('creates an Express application', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });
});
