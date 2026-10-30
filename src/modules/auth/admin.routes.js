import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { clientIpKey, createRateLimiter } from '../../common/middleware/rate-limit.js';
import { validate } from '../../common/middleware/validate.js';
import * as authController from './controller.js';
import { loginBodySchema } from './validators.js';

/**
 * Staff-only auth surface mounted at /api/v1/admin/auth.
 */
const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${clientIpKey(req)}:${email}`;
  },
});

/**
 * @openapi
 * /api/v1/admin/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Staff CMS login (SUPER_ADMIN, ADMIN, EDITOR only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Signed in; sets auth cookies
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Not a staff role
 *       423:
 *         description: Account locked
 */
router.post(
  '/login',
  loginLimiter,
  validate({ body: loginBodySchema }),
  asyncHandler(authController.staffLogin),
);

export default router;
