import { Router } from 'express';
import { ALL_ROLES } from '../common/constants/roles.js';
import { authenticate } from '../common/middleware/authenticate.js';
import { authorize } from '../common/middleware/authorize.js';

/**
 * CMS / admin surface for spcms_frontend.
 * Domain modules mount admin routes here in later phases.
 * Route-level RBAC is applied at this boundary; finer permissions stay in authorize helpers.
 *
 * @openapi
 * /api/v1/admin:
 *   get:
 *     tags: [Admin]
 *     summary: Admin API surface
 *     security:
 *       - bearerAuth: []
 *     description: Requires an admin JWT with a recognised role. Business endpoints will be mounted later.
 *     responses:
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Authenticated but missing an admin role
 */
const router = Router();

router.use(authenticate);
router.use(authorize(...ALL_ROLES));

export default router;
