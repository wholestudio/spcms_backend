import jwt from 'jsonwebtoken';
import { config } from '../../config/config.js';

export function signAccessToken(payload, options = {}) {
  const { sub, role, ...rest } = payload;
  return jwt.sign(
    {
      sub,
      role,
      ...rest,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.accessExpiresIn,
      ...options,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
