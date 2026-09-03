import { Router } from 'express';
import { authenticate } from '../common/middleware/authenticate.js';

/**
 * Authenticated customer surface for studiopatron_app.
 * Domain modules mount customer routes here in later phases.
 *
 * @openapi
 * /api/v1/customer:
 *   get:
 *     tags: [Customer]
 *     summary: Customer API surface
 *     security:
 *       - bearerAuth: []
 *     description: Requires a customer JWT. Business endpoints will be mounted later.
 *     responses:
 *       401:
 *         description: Missing or invalid token
 */
const router = Router();

router.use(authenticate);

export default router;
