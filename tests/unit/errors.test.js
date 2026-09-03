import {
  AppError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/common/errors/app-error.js';
import { createErrorResponse, defaultErrorCode } from '../../src/common/responses/error.js';
import { createSuccessResponse } from '../../src/common/responses/success.js';

describe('AppError', () => {
  it('marks operational errors and preserves status metadata', () => {
    const error = new BadRequestError('Invalid input');
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.isOperational).toBe(true);
  });

  it('maps specialized HTTP errors', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(
      new ValidationError('bad', [{ field: 'name', message: 'required' }]).details,
    ).toHaveLength(1);
  });
});

describe('response envelopes', () => {
  it('builds a success envelope', () => {
    const body = createSuccessResponse({ data: { ok: true }, message: 'API is running' });
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ ok: true });
    expect(body.message).toBe('API is running');
    expect(body.meta.timestamp).toEqual(expect.any(String));
  });

  it('builds an error envelope without leaking internals', () => {
    const body = createErrorResponse({
      statusCode: 404,
      message: 'Route GET /missing not found',
      requestId: 'req-1',
    });
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.meta.requestId).toBe('req-1');
    expect(body).not.toHaveProperty('stack');
  });

  it('maps status codes to error codes', () => {
    expect(defaultErrorCode(401)).toBe('UNAUTHORIZED');
    expect(defaultErrorCode(500)).toBe('INTERNAL_SERVER_ERROR');
  });
});
