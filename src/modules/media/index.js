/**
 * Media domain.
 *
 * Upload, list, metadata update, and delete for CMS images.
 * Files are stored on Cloudinary and served via CDN.
 * PostgreSQL stores metadata and Cloudinary public_id only — never binaries.
 *
 * Flow: CMS → Backend → Cloudinary → CDN → Customer Website
 */

export { default as routes } from './routes.js';
export { MODULE_NAME } from './constants.js';
export * as mediaService from './service.js';
