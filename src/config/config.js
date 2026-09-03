import { env } from './env.js';

function parseCorsOrigins(raw, isProduction) {
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction) {
    if (origins.length === 0 || origins.includes('*')) {
      throw new Error(
        'CORS_ORIGINS must list explicit origins in production. Wildcard (*) is not allowed.',
      );
    }
  }

  return origins;
}

const isProduction = env.NODE_ENV === 'production';
const isDevelopment = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction,
  isDevelopment,
  isTest,
  host: env.HOST,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  api: {
    prefix: '/api/v1',
    baseUrl: env.API_BASE_URL,
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    origins: parseCorsOrigins(env.CORS_ORIGINS, isProduction),
  },
  swagger: {
    enabled: env.SWAGGER_ENABLED ?? !isProduction,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
});
