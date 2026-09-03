import pino from 'pino';
import { config } from '../../config/config.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'creditCard',
  '*.password',
  '*.token',
  '*.secret',
  '*.authorization',
];

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(config.isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : {}),
});
