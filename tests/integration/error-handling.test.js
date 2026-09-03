import request from 'supertest';
import { createApp } from '../../src/app.js';
import { signAccessToken } from '../../src/common/utils/jwt.js';
import { ROLES } from '../../src/common/constants/roles.js';

const app = createApp();

describe('error handling', () => {
  it('returns a consistent 404 envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.message).toMatch(/not found/i);
    expect(response.body).not.toHaveProperty('stack');
  });

  it('rejects malformed JSON without leaking internals', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('content-type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });
});

describe('route surfaces', () => {
  it('requires a JWT on the customer surface', async () => {
    const response = await request(app).get('/api/v1/customer/profile');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('requires a JWT on the admin surface', async () => {
    const response = await request(app).get('/api/v1/admin/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an authenticated user without an admin role', async () => {
    const token = signAccessToken({ sub: 'user-1', roles: [] });
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 on admin when authenticated with a valid role and no endpoint exists', async () => {
    const token = signAccessToken({ sub: 'admin-1', roles: [ROLES.SUPER_ADMIN] });
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
