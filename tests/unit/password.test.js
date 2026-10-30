import { hashPassword, verifyPassword, needsRehash } from '../../src/common/utils/password.js';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(hash).not.toBe('correct-horse-battery');
    expect(hash.startsWith('$argon2')).toBe(true);
    await expect(verifyPassword('correct-horse-battery', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('reports that a fresh hash does not need rehash', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(needsRehash(hash)).toBe(false);
  });

  it('treats an invalid hash as needing rehash', () => {
    expect(needsRehash('not-a-valid-argon2-hash')).toBe(true);
  });
});
