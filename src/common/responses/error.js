export function defaultErrorCode(statusCode) {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR';
  }
}

export function createErrorResponse({ statusCode, message, code, details, requestId } = {}) {
  return {
    success: false,
    message,
    error: {
      code: code ?? defaultErrorCode(statusCode),
      ...(details ? { details } : {}),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function sendError(res, options = {}) {
  const statusCode = options.statusCode ?? 500;
  return res.status(statusCode).json(
    createErrorResponse({
      statusCode,
      message: options.message,
      code: options.code,
      details: options.details,
      requestId: options.requestId ?? res.req?.id,
    }),
  );
}
