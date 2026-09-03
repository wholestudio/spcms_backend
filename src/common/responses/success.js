export function createSuccessResponse({ data = {}, message = 'OK', requestId, pagination } = {}) {
  return {
    success: true,
    data,
    message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...(pagination ? { pagination } : {}),
    },
  };
}

export function sendSuccess(res, options = {}) {
  const statusCode = options.statusCode ?? 200;
  return res.status(statusCode).json(
    createSuccessResponse({
      data: options.data,
      message: options.message,
      requestId: options.requestId ?? res.req?.id,
      pagination: options.pagination,
    }),
  );
}
