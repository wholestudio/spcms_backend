import { Readable } from 'node:stream';
import { cloudinary, assertCloudinaryConfigured } from '../../config/cloudinary.js';
import { BadRequestError, NotFoundError, AppError } from '../../common/errors/app-error.js';
import { paginate } from '../../common/pagination/pagination.js';
import * as mediaRepository from './repository.js';

/**
 * Stream a memory buffer to Cloudinary via upload_stream (no disk writes).
 * @param {Buffer} buffer
 * @param {{ folder?: string }} options
 */
function uploadBufferToCloudinary(buffer, { folder } = {}) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        ...(folder ? { folder } : {}),
      },
      (error, result) => {
        if (error) {
          reject(
            new AppError(`Cloudinary upload failed: ${error.message}`, {
              statusCode: 502,
              code: 'CLOUDINARY_UPLOAD_FAILED',
            }),
          );
          return;
        }
        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

function buildThumbnailUrl(publicId) {
  return cloudinary.url(publicId, {
    width: 300,
    crop: 'fill',
    secure: true,
  });
}

/**
 * Upload an image to Cloudinary and persist metadata in PostgreSQL.
 */
export async function uploadMedia({ file, folder, entityType, entityId, altText, userId }) {
  if (!file?.buffer) {
    throw new BadRequestError('No file provided. Send a multipart field named "file".');
  }

  const result = await uploadBufferToCloudinary(file.buffer, { folder });
  const thumbnailUrl = buildThumbnailUrl(result.public_id);

  return mediaRepository.createMedia({
    fileName: file.originalname,
    url: result.secure_url,
    thumbnailUrl,
    publicId: result.public_id,
    altText: altText || null,
    mimeType: file.mimetype,
    size: result.bytes ?? file.size,
    width: result.width ?? null,
    height: result.height ?? null,
    folder: folder || result.folder || null,
    entityType: entityType || null,
    entityId: entityId || null,
    createdBy: userId || null,
  });
}

/**
 * Paginated media list, newest first. Filterable by entityType / entityId / folder.
 */
export async function listMedia({ entityType, entityId, folder, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const { items, total } = await mediaRepository.findMediaMany({
    entityType,
    entityId,
    folder,
    page: safePage,
    limit: safeLimit,
  });

  return paginate(items, total, safePage, safeLimit);
}

export async function getMediaById(id) {
  const media = await mediaRepository.findMediaById(id);

  if (!media) {
    throw new NotFoundError(`Media with id "${id}" was not found`);
  }

  return media;
}

/**
 * Update metadata only — never touches the Cloudinary file.
 */
export async function updateMedia(id, { altText, folder } = {}) {
  await getMediaById(id);

  const data = {};
  if (altText !== undefined) {
    data.altText = altText;
  }
  if (folder !== undefined) {
    data.folder = folder;
  }

  if (Object.keys(data).length === 0) {
    throw new BadRequestError('Provide at least one of: altText, folder');
  }

  return mediaRepository.updateMediaById(id, data);
}

/**
 * Destroy on Cloudinary first; only delete the DB row if Cloudinary succeeds.
 */
export async function deleteMedia(id) {
  const media = await getMediaById(id);

  assertCloudinaryConfigured();

  let destroyResult;
  try {
    destroyResult = await cloudinary.uploader.destroy(media.publicId);
  } catch (error) {
    throw new AppError(
      `Failed to delete file from Cloudinary: ${error.message}. Database record was not removed.`,
      {
        statusCode: 502,
        code: 'CLOUDINARY_DELETE_FAILED',
      },
    );
  }

  if (destroyResult?.result !== 'ok' && destroyResult?.result !== 'not found') {
    throw new AppError(
      `Cloudinary rejected delete for public_id "${media.publicId}" (result: ${destroyResult?.result}). Database record was not removed.`,
      {
        statusCode: 502,
        code: 'CLOUDINARY_DELETE_FAILED',
      },
    );
  }

  await mediaRepository.deleteMediaById(id);

  return { id, deleted: true };
}
