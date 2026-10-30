import { Prisma } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt.js';
import { readCookie } from '../utils/cookies.js';
import { SESSION_COOKIE_NAME } from '../constants/api.js';
import { AppError, ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { findUserByIdForAuth } from '../../modules/auth/repository.js';
import { USER_STATUS } from '../../modules/auth/constants.js';

export function extractAccessToken(req) {
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (token) {
      return token;
    }
  }

  const cookieToken = readCookie(req, SESSION_COOKIE_NAME);
  return cookieToken || undefined;
}

/**
 * Verify JWT, load the user from the database, and attach a safe `req.user`.
 */
export async function authenticate(req, _res, next) {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    let user;
    try {
      user = await findUserByIdForAuth(userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientInitializationError ||
        error?.name === 'PrismaClientInitializationError'
      ) {
        throw new AppError('Authentication service unavailable', {
          statusCode: 503,
          code: 'SERVICE_UNAVAILABLE',
        });
      }
      throw error;
    }

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ForbiddenError('Account is suspended');
    }

    if (user.passwordChangedAt && payload.iat) {
      const changedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (payload.iat < changedAtSec) {
        throw new UnauthorizedError('Invalid or expired token');
      }
    }

    req.user = {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      roles: [user.role],
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
}
