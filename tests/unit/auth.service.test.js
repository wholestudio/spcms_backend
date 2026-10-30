import { jest } from '@jest/globals';
import { AUDIT_ACTIONS, GENERIC_REGISTER_MESSAGE } from '../../src/modules/auth/constants.js';

const recordAudit = jest.fn(async () => {});
const sendVerificationEmail = jest.fn(async () => {});
const sendPasswordResetEmail = jest.fn(async () => {});

jest.unstable_mockModule('../../src/common/audit/index.js', () => ({
  recordAudit,
}));

jest.unstable_mockModule('../../src/integrations/email/index.js', () => ({
  sendVerificationEmail,
  sendPasswordResetEmail,
  getEmailProvider: () => ({}),
  setEmailProvider: () => {},
}));

const { hashPassword } = await import('../../src/common/utils/password.js');
const authService = await import('../../src/modules/auth/service.js');

function createRepo(overrides = {}) {
  return {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    findUserByIdForAuth: jest.fn(),
    createCustomerUser: jest.fn(),
    updateUser: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    findEmailVerificationToken: jest.fn(),
    markEmailVerificationUsed: jest.fn(),
    invalidateUnusedEmailVerificationTokens: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    markPasswordResetUsed: jest.fn(),
    invalidateUnusedPasswordResetTokens: jest.fn(),
    createRefreshToken: jest.fn(),
    findRefreshTokenByHash: jest.fn(),
    revokeRefreshTokenFamily: jest.fn(),
    revokeAllRefreshTokensForUser: jest.fn(),
    rotateRefreshToken: jest.fn(),
    markUserEmailVerified: jest.fn(),
    ...overrides,
  };
}

describe('authService', () => {
  beforeEach(() => {
    recordAudit.mockClear();
    sendVerificationEmail.mockClear();
    sendPasswordResetEmail.mockClear();
  });

  describe('register anti-enumeration', () => {
    it('returns the same generic message when the email already exists', async () => {
      const repo = createRepo({
        findUserByEmail: jest.fn(async () => ({
          id: 'u1',
          email: 'a@example.com',
          deletedAt: null,
        })),
      });

      const result = await authService.register(
        {
          email: 'A@Example.com',
          password: 'long-enough-password',
          firstName: 'Ada',
        },
        {},
        repo,
      );

      expect(result.message).toBe(GENERIC_REGISTER_MESSAGE);
      expect(repo.createCustomerUser).not.toHaveBeenCalled();
    });
  });

  describe('login lockout', () => {
    it('locks the account after MAX_FAILED_LOGINS bad passwords', async () => {
      const passwordHash = await hashPassword('correct-horse-battery');
      const user = {
        id: 'u1',
        email: 'a@example.com',
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        deletedAt: null,
        failedLoginAttempts: 4,
        lockedUntil: null,
      };
      const repo = createRepo({
        findUserByEmail: jest.fn(async () => user),
        updateUser: jest.fn(async (_id, data) => ({ ...user, ...data })),
      });

      await expect(
        authService.login({ email: 'a@example.com', password: 'wrong-password-xx' }, {}, {}, repo),
      ).rejects.toMatchObject({ statusCode: 423, code: 'ACCOUNT_LOCKED' });

      expect(repo.updateUser).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      );
      expect(recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: AUDIT_ACTIONS.ACCOUNT_LOCKED }),
      );
    });
  });

  describe('refresh rotation and reuse', () => {
    it('rotates an active refresh token', async () => {
      const user = {
        id: 'u1',
        email: 'a@example.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        deletedAt: null,
        firstName: 'Ada',
        lastName: null,
      };
      const existing = {
        id: 'rt1',
        userId: 'u1',
        familyId: 'fam-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        userAgent: null,
        ipAddress: null,
      };
      const repo = createRepo({
        findRefreshTokenByHash: jest.fn(async () => existing),
        findUserById: jest.fn(async () => user),
        findUserByIdForAuth: jest.fn(async () => user),
        rotateRefreshToken: jest.fn(async () => ({ id: 'rt2' })),
      });

      const result = await authService.refresh('raw-refresh-token-value', {}, repo);

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe('raw-refresh-token-value');
      expect(repo.rotateRefreshToken).toHaveBeenCalled();
    });

    it('revokes the family when a revoked token is reused', async () => {
      const existing = {
        id: 'rt1',
        userId: 'u1',
        familyId: 'fam-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      };
      const repo = createRepo({
        findRefreshTokenByHash: jest.fn(async () => existing),
        revokeRefreshTokenFamily: jest.fn(async () => ({ count: 2 })),
      });

      await expect(authService.refresh('reused-token', {}, repo)).rejects.toMatchObject({
        statusCode: 401,
      });

      expect(repo.revokeRefreshTokenFamily).toHaveBeenCalledWith('fam-1');
      expect(recordAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: AUDIT_ACTIONS.TOKEN_REUSE_DETECTED }),
      );
    });
  });
});
