/**
 * Auth integration tests against Postgres.
 *
 * Prerequisites:
 *   docker compose up -d postgres
 *   npx prisma migrate deploy   # or migrate dev
 *   npm run seed:admin          # optional, for staff login checks
 *
 * Run:
 *   npm test -- tests/integration/auth.test.js
 *
 * Set RUN_AUTH_INTEGRATION=1 to fail instead of skip when the DB is down.
 */
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/database/index.js';
import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '../../src/common/constants/api.js';
import { generateOpaqueToken, hashToken } from '../../src/common/utils/tokens.js';

const app = createApp();
const runHard = process.env.RUN_AUTH_INTEGRATION === '1';

let dbReady = false;

function cookieValue(setCookieHeader, name) {
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader].filter(Boolean);
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.split(';')[0].slice(name.length + 1));
    }
  }
  return undefined;
}

beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch (error) {
    if (runHard) {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.warn(
      'Skipping auth integration tests: database unavailable. Start Postgres and run migrations.',
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});

const itDb = (name, fn) => {
  it(name, async () => {
    if (!dbReady) {
      return;
    }
    await fn();
  });
};

describe('auth flow', () => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `customer-${suffix}@example.com`;
  const password = 'SecurePass99!';
  let verifyToken;
  let resetToken;

  afterAll(async () => {
    if (!dbReady) return;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  itDb('register -> verify -> login -> me -> refresh -> logout', async () => {
    const register = await request(app).post('/api/v1/auth/register').send({
      email,
      password,
      firstName: 'Casey',
      lastName: 'Customer',
    });
    expect(register.status).toBe(201);
    expect(register.body.message).toMatch(/verification|registered|email/i);
    expect(register.body.data).not.toHaveProperty('refreshToken');

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    expect(user.role).toBe('CUSTOMER');
    expect(user.status).toBe('PENDING_VERIFICATION');

    verifyToken = generateOpaqueToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verifyToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const verify = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verifyToken });
    expect(verify.status).toBe(200);
    expect(verify.body.data.user.status).toBe('ACTIVE');

    const agent = request.agent(app);
    const login = await agent.post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(email);
    expect(login.body.data).not.toHaveProperty('refreshToken');
    expect(login.body.data).not.toHaveProperty('token');

    const setCookie = login.headers['set-cookie'];
    expect(cookieValue(setCookie, SESSION_COOKIE_NAME)).toBeTruthy();
    expect(cookieValue(setCookie, REFRESH_COOKIE_NAME)).toBeTruthy();

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(email);
    expect(me.body.data.user).not.toHaveProperty('passwordHash');

    const refresh = await agent.post('/api/v1/auth/refresh');
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.user.email).toBe(email);

    const logout = await agent.post('/api/v1/auth/logout');
    expect(logout.status).toBe(200);

    const meAfter = await agent.get('/api/v1/auth/me');
    expect(meAfter.status).toBe(401);
  });

  itDb('forgot-password -> reset-password allows login with the new password', async () => {
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();

    const forgot = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email });
    expect(forgot.status).toBe(200);

    resetToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const newPassword = 'AnotherSecure1!';
    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword });
    expect(reset.status).toBe(200);

    const loginOld = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword });
    expect(loginNew.status).toBe(200);
  });

  itDb('rejects customer credentials on staff login', async () => {
    const response = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email, password: 'AnotherSecure1!' });
    expect(response.status).toBe(403);
  });
});
