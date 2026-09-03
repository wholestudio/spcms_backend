import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from '../../config/config.js';
import { AppError, ValidationError } from '../errors/app-error.js';
import { sendError } from '../responses/error.js';
import { logger } from '../utils/logger.js';

function mapPrismaError(error) {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this value already exists',
        code: 'CONFLICT',
      };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found', code: 'NOT_FOUND' };
    default:
      return { statusCode: 400, message: 'Database request failed', code: 'DATABASE_ERROR' };
  }
}

export function errorHandler(err, req, res, _next) {
  const requestId = req.id;

  if (err instanceof ValidationError || err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message);
    } else {
      logger.warn({ requestId, code: err.code }, err.message);
    }

    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details,
      requestId,
    });
  }

  if (err instanceof ZodError) {
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
      requestId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    logger.warn({ requestId, code: mapped.code, prismaCode: err.code }, mapped.message);
    return sendError(res, { ...mapped, requestId });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, {
      statusCode: 400,
      message: 'Invalid database query',
      code: 'PRISMA_VALIDATION_ERROR',
      requestId,
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return sendError(res, {
      statusCode: 403,
      message: 'Origin not allowed',
      code: 'CORS_REJECTED',
      requestId,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, {
      statusCode: 400,
      message: 'Invalid JSON payload',
      code: 'INVALID_JSON',
      requestId,
    });
  }

  logger.error({ err, requestId }, 'Unhandled error');

  return sendError(res, {
    statusCode: 500,
    message: config.isProduction ? 'An unexpected error occurred' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
  });
}
