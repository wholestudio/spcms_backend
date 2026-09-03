import { Router } from 'express';
import { config } from '../config/config.js';
import { sendSuccess } from '../common/responses/success.js';

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     description: Returns a structured response showing that the API process is running.
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
const router = Router();

router.get('/health', (req, res) => {
  sendSuccess(res, {
    data: {
      status: 'ok',
      service: 'studio-patron-api',
      environment: config.env,
      timestamp: new Date().toISOString(),
    },
    message: 'API is running',
    requestId: req.id,
  });
});

export default router;
