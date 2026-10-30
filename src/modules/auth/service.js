import { recordAudit } from '../../common/audit/index.js';
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
} from '../../common/errors/app-error.js';
import { STAFF_ROLES } from '../../common/constants/roles.js';
import { signAccessToken } from '../../common/utils/jwt.js';
import { hashPassword, verifyPassword } from '../../common/utils/password.js';
import { generateOpaqueToken, hashToken, newTokenFamilyId } from '../../common/utils/tokens.js';
import { config } from '../../config/config.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../integrations/email/index.js';
import {
  AUDIT_ACTIONS,
  GENERIC_EMAIL_MESSAGE,
  GENERIC_REGISTER_MESSAGE,
  USER_STATUS,
} from './constants.js';
import * as defaultRepo from './repository.js';

let dummyPasswordHash;

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = await hashPassword('timing-dummy-password-not-used');
  }
  return dummyPasswordHash;
}

function requestMeta(meta = {}) {
  return {
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  };
}

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function issueAccessToken(user) {
  return signAccessToken({
    sub: user.id,
    role: user.role,
  });
}

function refreshExpiryDate() {
  const expires = new Date();
  expires.setDate(expires.getDate() + config.auth.refreshTokenTtlDays);
  return expires;
}

function verificationExpiryDate() {
  const expires = new Date();
  expires.setHours(expires.getHours() + config.auth.emailVerifyTtlHours);
  return expires;
}

function passwordResetExpiryDate() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + config.auth.passwordResetTtlMinutes);
  return expires;
}

function isLocked(user, now = new Date()) {
  return Boolean(user?.lockedUntil && user.lockedUntil > now);
}

function assertNotDeleted(user) {
  if (!user || user.deletedAt) {
    return null;
  }
  return user;
}

async function createSessionTokens(user, meta, repo, { familyId } = {}) {
  const accessToken = issueAccessToken(user);
  const rawRefresh = generateOpaqueToken();
  const tokenHash = hashToken(rawRefresh);
  const resolvedFamilyId = familyId ?? newTokenFamilyId();
  const { ipAddress, userAgent } = requestMeta(meta);

  await repo.createRefreshToken({
    userId: user.id,
    tokenHash,
    familyId: resolvedFamilyId,
    userAgent,
    ipAddress,
    expiresAt: refreshExpiryDate(),
  });

  return { accessToken, refreshToken: rawRefresh, familyId: resolvedFamilyId };
}

async function sendVerifyLink(email, rawToken) {
  const verifyUrl = `${config.auth.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendVerificationEmail({ to: email, verifyUrl });
}

async function sendResetLink(email, rawToken) {
  const resetUrl = `${config.auth.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail({ to: email, resetUrl });
}

/**
 * @param {object} input
 * @param {object} [meta]
 * @param {typeof defaultRepo} [repo]
 */
export async function register(input, meta = {}, repo = defaultRepo) {
  const email = input.email.trim().toLowerCase();
  const existing = await repo.findUserByEmail(email);

  if (existing && !existing.deletedAt) {
    await recordAudit({
      userId: existing.id,
      action: AUDIT_ACTIONS.REGISTER,
      entityType: 'User',
      entityId: existing.id,
      ...requestMeta(meta),
      metadata: { duplicate: true },
    });
    return { message: GENERIC_REGISTER_MESSAGE };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await repo.createCustomerUser({
    email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName ?? null,
    passwordChangedAt: new Date(),
  });

  const rawToken = generateOpaqueToken();
  await repo.createEmailVerificationToken({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: verificationExpiryDate(),
  });

  await sendVerifyLink(email, rawToken);

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.REGISTER,
    entityType: 'User',
    entityId: user.id,
    ...requestMeta(meta),
  });

  return { message: GENERIC_REGISTER_MESSAGE };
}

export async function verifyEmail({ token }, meta = {}, repo = defaultRepo) {
  const record = await repo.findEmailVerificationToken(hashToken(token));
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('Invalid or expired verification token', {
      statusCode: 400,
      code: 'INVALID_TOKEN',
    });
  }

  const user = assertNotDeleted(record.user);
  if (!user) {
    throw new AppError('Invalid or expired verification token', {
      statusCode: 400,
      code: 'INVALID_TOKEN',
    });
  }

  await repo.markEmailVerificationUsed(record.id);
  const updated = await repo.markUserEmailVerified(user.id);

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.EMAIL_VERIFIED,
    entityType: 'User',
    entityId: user.id,
    ...requestMeta(meta),
  });

  return { user: toPublicUser(updated), message: 'Email verified' };
}

export async function resendVerification({ email }, meta = {}, repo = defaultRepo) {
  const normalised = email.trim().toLowerCase();
  const user = assertNotDeleted(await repo.findUserByEmail(normalised));

  if (user && user.status === USER_STATUS.PENDING_VERIFICATION) {
    await repo.invalidateUnusedEmailVerificationTokens(user.id);
    const rawToken = generateOpaqueToken();
    await repo.createEmailVerificationToken({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: verificationExpiryDate(),
    });
    await sendVerifyLink(normalised, rawToken);
  }

  return { message: GENERIC_EMAIL_MESSAGE };
}

/**
 * @param {{ email: string, password: string }} input
 * @param {{ staffOnly?: boolean }} [options]
 */
export async function login(input, meta = {}, options = {}, repo = defaultRepo) {
  const email = input.email.trim().toLowerCase();
  const user = assertNotDeleted(await repo.findUserByEmail(email));
  const { ipAddress, userAgent } = requestMeta(meta);

  const passwordHash = user?.passwordHash ?? (await getDummyPasswordHash());
  const matches = user?.passwordHash
    ? await verifyPassword(input.password, passwordHash)
    : await verifyPassword(input.password, await getDummyPasswordHash());

  if (!user) {
    await recordAudit({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      ...requestMeta(meta),
      metadata: { email, reason: 'unknown_user' },
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  if (isLocked(user)) {
    await recordAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      ...requestMeta(meta),
      metadata: { reason: 'locked' },
    });
    throw new AppError('Account temporarily locked. Try again later.', {
      statusCode: 423,
      code: 'ACCOUNT_LOCKED',
    });
  }

  if (!matches) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const max = config.auth.maxFailedLogins;
    const patch = { failedLoginAttempts: attempts };

    if (attempts >= max) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + config.auth.lockoutMinutes);
      patch.lockedUntil = lockedUntil;

      await repo.updateUser(user.id, patch);
      await recordAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
        entityType: 'User',
        entityId: user.id,
        ...requestMeta(meta),
        metadata: { attempts },
      });
      throw new AppError('Account temporarily locked. Try again later.', {
        statusCode: 423,
        code: 'ACCOUNT_LOCKED',
      });
    }

    await repo.updateUser(user.id, patch);
    await recordAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      ...requestMeta(meta),
      metadata: { reason: 'bad_password', attempts },
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ForbiddenError('Account is suspended');
  }

  if (user.status === USER_STATUS.PENDING_VERIFICATION) {
    throw new AppError('Please verify your email before signing in', {
      statusCode: 403,
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  if (options.staffOnly && !STAFF_ROLES.includes(user.role)) {
    throw new ForbiddenError('Staff access required');
  }

  await repo.updateUser(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date(),
  });

  const tokens = await createSessionTokens(user, meta, repo);

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    entityType: 'User',
    entityId: user.id,
    ipAddress,
    userAgent,
    metadata: { staffOnly: Boolean(options.staffOnly) },
  });

  const fresh = await repo.findUserByIdForAuth(user.id);

  return {
    user: toPublicUser(fresh),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function refresh(rawRefreshToken, meta = {}, repo = defaultRepo) {
  if (!rawRefreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const existing = await repo.findRefreshTokenByHash(tokenHash);

  if (!existing) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (existing.revokedAt) {
    await repo.revokeRefreshTokenFamily(existing.familyId);
    await recordAudit({
      userId: existing.userId,
      action: AUDIT_ACTIONS.TOKEN_REUSE_DETECTED,
      entityType: 'RefreshToken',
      entityId: existing.id,
      ...requestMeta(meta),
      metadata: { familyId: existing.familyId },
    });
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (existing.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = assertNotDeleted(await repo.findUserById(existing.userId));
  if (!user) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ForbiddenError('Account is suspended');
  }

  const newRaw = generateOpaqueToken();
  await repo.rotateRefreshToken({
    oldTokenId: existing.id,
    familyId: existing.familyId,
    userId: user.id,
    tokenHash: hashToken(newRaw),
    userAgent: meta.userAgent ?? existing.userAgent,
    ipAddress: meta.ipAddress ?? existing.ipAddress,
    expiresAt: refreshExpiryDate(),
  });

  const accessToken = issueAccessToken(user);

  return {
    user: toPublicUser(await repo.findUserByIdForAuth(user.id)),
    accessToken,
    refreshToken: newRaw,
  };
}

export async function logout(rawRefreshToken, meta = {}, repo = defaultRepo) {
  if (rawRefreshToken) {
    const existing = await repo.findRefreshTokenByHash(hashToken(rawRefreshToken));
    if (existing && !existing.revokedAt) {
      await repo.revokeRefreshTokenFamily(existing.familyId);
      await recordAudit({
        userId: existing.userId,
        action: AUDIT_ACTIONS.LOGOUT,
        entityType: 'RefreshToken',
        entityId: existing.id,
        ...requestMeta(meta),
      });
    }
  }

  return { message: 'Signed out' };
}

export async function logoutAll(userId, meta = {}, repo = defaultRepo) {
  await repo.revokeAllRefreshTokensForUser(userId);
  await recordAudit({
    userId,
    action: AUDIT_ACTIONS.LOGOUT_ALL,
    entityType: 'User',
    entityId: userId,
    ...requestMeta(meta),
  });
  return { message: 'All sessions revoked' };
}

export async function forgotPassword({ email }, meta = {}, repo = defaultRepo) {
  const normalised = email.trim().toLowerCase();
  const user = assertNotDeleted(await repo.findUserByEmail(normalised));

  if (user && user.passwordHash) {
    await repo.invalidateUnusedPasswordResetTokens(user.id);
    const rawToken = generateOpaqueToken();
    await repo.createPasswordResetToken({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: passwordResetExpiryDate(),
    });
    await sendResetLink(normalised, rawToken);
    await recordAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      entityType: 'User',
      entityId: user.id,
      ...requestMeta(meta),
    });
  }

  return { message: GENERIC_EMAIL_MESSAGE };
}

export async function resetPassword({ token, newPassword }, meta = {}, repo = defaultRepo) {
  const record = await repo.findPasswordResetToken(hashToken(token));
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError('Invalid or expired reset token', {
      statusCode: 400,
      code: 'INVALID_TOKEN',
    });
  }

  const user = assertNotDeleted(record.user);
  if (!user) {
    throw new AppError('Invalid or expired reset token', {
      statusCode: 400,
      code: 'INVALID_TOKEN',
    });
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await repo.markPasswordResetUsed(record.id);
  await repo.updateUser(user.id, {
    passwordHash,
    passwordChangedAt: now,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
  await repo.revokeAllRefreshTokensForUser(user.id);

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
    entityType: 'User',
    entityId: user.id,
    ...requestMeta(meta),
  });

  return { message: 'Password updated' };
}

export async function changePassword(userId, { currentPassword, newPassword }, meta = {}, repo = defaultRepo) {
  const user = assertNotDeleted(await repo.findUserById(userId));
  if (!user?.passwordHash) {
    throw new UnauthorizedError('Authentication required');
  }

  const local = user.email.split('@')[0]?.toLowerCase();
  if (local && local.length >= 2 && newPassword.toLowerCase().includes(local)) {
    throw new AppError('Password must not contain your email local part', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await repo.updateUser(user.id, {
    passwordHash,
    passwordChangedAt: now,
  });
  await repo.revokeAllRefreshTokensForUser(user.id);

  const tokens = await createSessionTokens(user, meta, repo);

  await recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
    entityType: 'User',
    entityId: user.id,
    ...requestMeta(meta),
  });

  return {
    user: toPublicUser(await repo.findUserByIdForAuth(user.id)),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    message: 'Password changed',
  };
}

export async function me(userId, repo = defaultRepo) {
  const user = assertNotDeleted(await repo.findUserByIdForAuth(userId));
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw new ForbiddenError('Account is suspended');
  }
  return toPublicUser(user);
}
