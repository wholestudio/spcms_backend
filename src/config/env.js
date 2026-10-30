import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanFromEnv = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().min(1).default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    API_BASE_URL: z.string().url().default('http://localhost:4000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional().default(''),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
    LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
    EMAIL_VERIFY_TTL_HOURS: z.coerce.number().int().positive().default(24),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    COOKIE_DOMAIN: z.string().optional().default(''),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_SECURE: booleanFromEnv,
    CORS_ORIGINS: z.string().default(''),
    SWAGGER_ENABLED: booleanFromEnv,
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    BOOTSTRAP_ADMIN_EMAIL: z.union([z.literal(''), z.string().trim().email()]).default(''),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().optional().default(''),
    BOOTSTRAP_ADMIN_NAME: z.string().trim().min(1).default('Studio Patron Admin'),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be at least 32 characters in production',
      });
    }

    if (data.BOOTSTRAP_ADMIN_EMAIL && data.BOOTSTRAP_ADMIN_PASSWORD.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BOOTSTRAP_ADMIN_PASSWORD'],
        message:
          'BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters when a bootstrap admin email is set',
      });
    }
  });

/**
 * Validate environment variables and fail with a clear configuration error.
 * @param {NodeJS.ProcessEnv | Record<string, unknown>} source
 */
export function loadEnv(source = process.env) {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('\n');
    const message = `Invalid environment configuration:\n${issues}`;
    console.error(message);
    throw new Error(message);
  }

  return parsed.data;
}

export const env = loadEnv();
