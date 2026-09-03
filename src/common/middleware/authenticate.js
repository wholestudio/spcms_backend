import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/app-error.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication required');
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
