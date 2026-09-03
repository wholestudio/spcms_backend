import { ZodError } from 'zod';
import { ValidationError } from '../errors/app-error.js';

function parsePart(schema, value, label) {
  const result = schema.safeParse(value);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: [label, ...issue.path].filter(Boolean).join('.'),
      message: issue.message,
    }));
    throw new ValidationError(`Invalid ${label}`, details);
  }

  return result.data;
}

/**
 * Validate request body, query, and/or route params with Zod schemas.
 */
export function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    try {
      if (body) {
        req.body = parsePart(body, req.body, 'body');
      }
      if (query) {
        req.query = parsePart(query, req.query, 'query');
      }
      if (params) {
        req.params = parsePart(params, req.params, 'params');
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            'Validation failed',
            error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}
