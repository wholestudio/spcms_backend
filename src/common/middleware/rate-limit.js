import rateLimit from 'express-rate-limit';
import { config } from '../../config/config.js';
import { TooManyRequestsError } from '../errors/app-error.js';

/**
 * In-memory rate limiter. Replace `store` with a Redis store when horizontal
 * scaling requires a shared counter.
 */
export function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.originalUrl === '/api/v1/health' || req.path === '/health',
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError('Too many requests, please try again later'));
    },
    ...options,
  });
}
