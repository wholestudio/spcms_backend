import { NotFoundError } from '../errors/app-error.js';

export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
