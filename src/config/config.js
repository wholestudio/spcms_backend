import { env } from './env.js';
import { ROLES } from '../common/constants/roles.js';

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

const bootstrapEmail = env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();

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
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    /** @deprecated use accessExpiresIn — kept for callers still reading expiresIn */
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  },
  auth: {
    refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    maxFailedLogins: env.MAX_FAILED_LOGINS,
    lockoutMinutes: env.LOCKOUT_MINUTES,
    emailVerifyTtlHours: env.EMAIL_VERIFY_TTL_HOURS,
    passwordResetTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
    frontendUrl: env.FRONTEND_URL,
    bootstrap: bootstrapEmail
      ? Object.freeze({
          id: '00000000-0000-4000-a000-000000000001',
          email: bootstrapEmail,
          displayName: env.BOOTSTRAP_ADMIN_NAME,
          role: ROLES.SUPER_ADMIN,
          password: env.BOOTSTRAP_ADMIN_PASSWORD,
        })
      : null,
  },
  cookies: {
    domain: env.COOKIE_DOMAIN || undefined,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE ?? isProduction,
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
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
});
