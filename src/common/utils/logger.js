import pino from 'pino';
import { config } from '../../config/config.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers.set-cookie',
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'creditCard',
  'cookie',
  'authorization',
  '*.password',
  '*.currentPassword',
  '*.newPassword',
  '*.token',
  '*.secret',
  '*.authorization',
  '*.cookie',
  '*.accessToken',
  '*.refreshToken',
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
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            singleLine: true,
          },
        },
      }
    : {}),
});
