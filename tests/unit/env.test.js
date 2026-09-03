import { loadEnv } from '../../src/config/env.js';

const valid = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://spcms:spcms@localhost:5432/spcms?schema=public',
  JWT_SECRET: 'test-secret-must-be-at-least-32-chars-long',
  JWT_EXPIRES_IN: '15m',
  CORS_ORIGINS: 'http://localhost:3000',
  API_BASE_URL: 'http://localhost:3000',
};

describe('loadEnv', () => {
  it('accepts a valid configuration', () => {
    const env = loadEnv(valid);
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('fails when DATABASE_URL is missing', () => {
    const source = { ...valid, DATABASE_URL: '' };
    expect(() => loadEnv(source)).toThrow(/DATABASE_URL/);
  });

  it('fails when JWT_SECRET is too short', () => {
    const source = { ...valid, JWT_SECRET: 'short' };
    expect(() => loadEnv(source)).toThrow(/JWT_SECRET/);
  });
});
