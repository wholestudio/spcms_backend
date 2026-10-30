import { sendSuccess } from '../../common/responses/success.js';
import { BadRequestError } from '../../common/errors/app-error.js';
import * as mediaService from './service.js';

export async function handleUpload(req, res) {
  if (!req.file) {
    throw new BadRequestError('No file uploaded. Attach an image using the "file" form field.');
  }

  const { folder, entityType, entityId, altText } = req.body ?? {};
  const userId = req.user?.id ?? req.user?.sub ?? null;

  const media = await mediaService.uploadMedia({
    file: req.file,
    folder,
    entityType,
    entityId,
    altText,
    userId,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: media,
    message: 'Media uploaded successfully',
    requestId: req.id,
  });
}

export async function list(req, res) {
  const { entityType, entityId, folder, page, limit } = req.query ?? {};

  const result = await mediaService.listMedia({
    entityType,
    entityId,
    folder,
    page,
    limit,
  });

  return sendSuccess(res, {
    data: result.items,
    pagination: result.pagination,
    message: 'Media list retrieved',
    requestId: req.id,
  });
}

export async function getById(req, res) {
  const media = await mediaService.getMediaById(req.params.id);

  return sendSuccess(res, {
    data: media,
    message: 'Media retrieved',
    requestId: req.id,
  });
}

export async function update(req, res) {
  const { altText, folder } = req.body ?? {};
  const media = await mediaService.updateMedia(req.params.id, { altText, folder });

  return sendSuccess(res, {
    data: media,
    message: 'Media updated',
    requestId: req.id,
  });
}

export async function remove(req, res) {
  const result = await mediaService.deleteMedia(req.params.id);

  return sendSuccess(res, {
    data: result,
    message: 'Media deleted',
    requestId: req.id,
  });
}
