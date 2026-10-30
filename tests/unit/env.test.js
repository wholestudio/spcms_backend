import { loadEnv } from '../../src/config/env.js';

const valid = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgresql://spcms:spcms@localhost:5432/spcms?schema=public',
  JWT_SECRET: 'test-secret-must-be-at-least-32-chars-long',
  JWT_ACCESS_EXPIRES_IN: '15m',
  CORS_ORIGINS: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:4000',
  FRONTEND_URL: 'http://localhost:3000',
};

describe('loadEnv', () => {
  it('accepts a valid configuration', () => {
    const env = loadEnv(valid);
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(env.REFRESH_TOKEN_TTL_DAYS).toBe(30);
    expect(env.MAX_FAILED_LOGINS).toBe(5);
    expect(env.COOKIE_SAME_SITE).toBe('lax');
  });

  it('fails when DATABASE_URL is missing', () => {
    const source = { ...valid, DATABASE_URL: '' };
    expect(() => loadEnv(source)).toThrow(/DATABASE_URL/);
  });

  it('requires JWT_SECRET to be at least 32 characters in production', () => {
    const source = { ...valid, NODE_ENV: 'production', JWT_SECRET: 'short', CORS_ORIGINS: 'https://app.example.com' };
    expect(() => loadEnv(source)).toThrow(/JWT_SECRET/);
  });

  it('allows a shorter JWT_SECRET outside production', () => {
    const source = { ...valid, NODE_ENV: 'test', JWT_SECRET: 'short-but-ok-in-test' };
    expect(() => loadEnv(source)).not.toThrow();
  });

  it('fails when a bootstrap email is set without a long enough password', () => {
    const source = {
      ...valid,
      BOOTSTRAP_ADMIN_EMAIL: 'admin@studiopatron.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'short',
    };
    expect(() => loadEnv(source)).toThrow(/BOOTSTRAP_ADMIN_PASSWORD/);
  });
});
