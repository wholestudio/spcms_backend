import argon2 from 'argon2';

const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
});

export async function hashPassword(plain) {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(plain, hash) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

/**
 * True when the stored hash should be upgraded to the current argon2id parameters.
 */
export function needsRehash(hash) {
  try {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  } catch {
    return true;
  }
}
