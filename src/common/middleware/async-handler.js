/**
 * Wrap async route handlers so rejected promises reach the error middleware.
 * Express 5 forwards async errors; this remains useful for explicit wrapping.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
