import { z } from 'zod';

export const mediaIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const listMediaQuerySchema = z.object({
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  folder: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateMediaBodySchema = z
  .object({
    altText: z.string().trim().nullable().optional(),
    folder: z.string().trim().nullable().optional(),
  })
  .refine((data) => data.altText !== undefined || data.folder !== undefined, {
    message: 'Provide at least one of: altText, folder',
  });
