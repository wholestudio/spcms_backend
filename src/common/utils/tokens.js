import { createHash, randomBytes, randomUUID } from 'node:crypto';

/** Opaque token (32 random bytes, base64url). */
export function generateOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 hex digest for storing tokens at rest. */
export function hashToken(rawToken) {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function newTokenFamilyId() {
  return randomUUID();
}
