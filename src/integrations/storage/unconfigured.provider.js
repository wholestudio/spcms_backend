/**
 * Storage provider contract.
 *
 * Future providers: Cloudinary, S3-compatible object storage, others.
 * PostgreSQL stores media metadata and object keys only — never image binaries.
 *
 * CMS → Backend → Storage Provider → CDN → Customer Website
 *
 * @typedef {object} StorageObject
 * @property {string} key
 * @property {string} [url]
 * @property {string} [contentType]
 * @property {number} [sizeBytes]
 *
 * @typedef {object} StorageProvider
 * @property {(input: { key: string, body: Buffer, contentType?: string }) => Promise<StorageObject>} upload
 * @property {(key: string) => Promise<void>} delete
 * @property {(key: string, expiresInSeconds?: number) => Promise<string>} getSignedUrl
 */
export class UnconfiguredStorageProvider {
  async upload() {
    throw new Error('Storage provider is not configured');
  }

  async delete() {
    throw new Error('Storage provider is not configured');
  }

  async getSignedUrl() {
    throw new Error('Storage provider is not configured');
  }
}
