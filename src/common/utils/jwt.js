import jwt from 'jsonwebtoken';
import { config } from '../../config/config.js';

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
