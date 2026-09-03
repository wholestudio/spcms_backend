/**
 * Media domain.
 *
 * CURRENT: architectural boundary only.
 * FUTURE: upload, delete, metadata, alt text, ordering, thumbnails,
 *         multiple images, and entity relationships.
 *
 * Files are stored by the storage provider (Cloudinary / S3 / other) and
 * served via CDN. PostgreSQL stores metadata and object keys only.
 * Never commit business images to git or store binaries in the database.
 *
 * Flow: CMS → Backend → Storage Provider → CDN → Customer Website
 */

export { default as routes } from './routes.js';
export { MODULE_NAME } from './constants.js';
