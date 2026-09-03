import { z } from 'zod';
import { LIST_QUERY_DEFAULTS } from '../pagination/list-query.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(LIST_QUERY_DEFAULTS.page),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIST_QUERY_DEFAULTS.maxLimit)
    .default(LIST_QUERY_DEFAULTS.limit),
});

export const listQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(255).optional(),
  sortBy: z.string().trim().max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
