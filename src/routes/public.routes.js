import { Router } from 'express';

/**
 * Unauthenticated customer-facing surface.
 * Domain modules mount public routes here in later phases.
 *
 * @openapi
 * /api/v1/public:
 *   get:
 *     tags: [Public]
 *     summary: Public API surface (placeholder mount)
 *     description: Business public endpoints will be mounted under this prefix later.
 *     responses:
 *       404:
 *         description: No public business endpoints are registered yet
 */
const router = Router();

export default router;
