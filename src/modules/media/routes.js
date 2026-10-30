import { Router } from 'express';
import { asyncHandler } from '../../common/middleware/async-handler.js';
import { authenticate } from '../../common/middleware/authenticate.js';
import { uploadSingle } from '../../common/middleware/upload.js';
import { validate } from '../../common/middleware/validate.js';
import * as mediaController from './controller.js';
import {
  listMediaQuerySchema,
  mediaIdParamsSchema,
  updateMediaBodySchema,
} from './validators.js';

/**
 * HTTP routes for the Media domain.
 *
 * Mounted at /api/v1/media (see routes/index.js).
 *
 * @openapi
 * tags:
 *   - name: Media
 *     description: Image upload and media metadata (Cloudinary + PostgreSQL)
 */
const router = Router();

/**
 * @openapi
 * /api/v1/media/upload:
 *   post:
 *     tags: [Media]
 *     summary: Upload an image
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *               entityType:
 *                 type: string
 *                 example: product
 *               entityId:
 *                 type: string
 *               altText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Media uploaded
 *       400:
 *         description: Missing or invalid file
 *       401:
 *         description: Authentication required
 */
router.post(
  '/upload',
  authenticate,
  uploadSingle,
  asyncHandler(mediaController.handleUpload),
);

/**
 * @openapi
 * /api/v1/media:
 *   get:
 *     tags: [Media]
 *     summary: List media (paginated)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: entityId
 *         schema: { type: string }
 *       - in: query
 *         name: folder
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated media list
 */
router.get(
  '/',
  authenticate,
  validate({ query: listMediaQuerySchema }),
  asyncHandler(mediaController.list),
);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   get:
 *     tags: [Media]
 *     summary: Get media by id
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Media record
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  authenticate,
  validate({ params: mediaIdParamsSchema }),
  asyncHandler(mediaController.getById),
);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   patch:
 *     tags: [Media]
 *     summary: Update media metadata
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altText: { type: string, nullable: true }
 *               folder: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated media
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id',
  authenticate,
  validate({ params: mediaIdParamsSchema, body: updateMediaBodySchema }),
  asyncHandler(mediaController.update),
);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   delete:
 *     tags: [Media]
 *     summary: Delete media from Cloudinary and the database
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 *       502:
 *         description: Cloudinary delete failed; DB row kept
 */
router.delete(
  '/:id',
  authenticate,
  validate({ params: mediaIdParamsSchema }),
  asyncHandler(mediaController.remove),
);

export default router;
