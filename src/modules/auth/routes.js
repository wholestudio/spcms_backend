import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { clientIpKey, createRateLimiter } from '../../common/middleware/rate-limit.js';
import { validate } from '../../common/middleware/validate.js';
import * as authController from './controller.js';
import {
  changePasswordBodySchema,
  emailOnlyBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  tokenBodySchema,
} from './validators.js';

const router = Router();

function emailIpKey(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
  return `${clientIpKey(req)}:${email}`;
}

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: emailIpKey,
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: emailIpKey,
});

const forgotLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: emailIpKey,
});

const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => clientIpKey(req),
});

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 10, maxLength: 128 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Generic success (anti-enumeration)
 *       400:
 *         description: Validation failed
 */
router.post(
  '/register',
  registerLimiter,
  validate({ body: registerBodySchema }),
  asyncHandler(authController.register),
);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  validate({ body: tokenBodySchema }),
  asyncHandler(authController.verifyEmail),
);

/**
 * @openapi
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Generic success (anti-enumeration)
 */
router.post(
  '/resend-verification',
  forgotLimiter,
  validate({ body: emailOnlyBodySchema }),
  asyncHandler(authController.resendVerification),
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in (customers and staff)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Signed in; sets spcms_session and spcms_refresh cookies
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Suspended or email not verified
 *       423:
 *         description: Account locked
 */
router.post(
  '/login',
  loginLimiter,
  validate({ body: loginBodySchema }),
  asyncHandler(authController.login),
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 *     description: Requires the httpOnly `spcms_refresh` cookie (path `/api/v1/auth`).
 *     responses:
 *       200:
 *         description: Tokens rotated
 *       401:
 *         description: Invalid, expired, or reused refresh token
 */
router.post('/refresh', refreshLimiter, asyncHandler(authController.refresh));

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke current refresh family and clear cookies
 *     responses:
 *       200:
 *         description: Signed out
 */
router.post('/logout', asyncHandler(authController.logout));

/**
 * @openapi
 * /api/v1/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke all refresh sessions for the current user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *       401:
 *         description: Authentication required
 */
router.post('/logout-all', authenticate, asyncHandler(authController.logoutAll));

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Generic success (anti-enumeration)
 */
router.post(
  '/forgot-password',
  forgotLimiter,
  validate({ body: emailOnlyBodySchema }),
  asyncHandler(authController.forgotPassword),
);

/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 10, maxLength: 128 }
 *     responses:
 *       200:
 *         description: Password updated; all sessions revoked
 *       400:
 *         description: Invalid token
 */
router.post(
  '/reset-password',
  validate({ body: resetPasswordBodySchema }),
  asyncHandler(authController.resetPassword),
);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password while authenticated
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 10, maxLength: 128 }
 *     responses:
 *       200:
 *         description: Password changed; fresh cookies issued
 *       401:
 *         description: Authentication failed
 */
router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordBodySchema }),
  asyncHandler(authController.changePassword),
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current authenticated user
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public user profile
 *       401:
 *         description: Authentication required
 */
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
