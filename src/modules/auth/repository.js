import { prisma } from '../../database/index.js';

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  deletedAt: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  passwordChangedAt: true,
  emailVerifiedAt: true,
};

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: authUserSelect,
  });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { ...authUserSelect, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true, updatedAt: true },
  });
}

export async function findUserByIdForAuth(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      deletedAt: true,
      passwordChangedAt: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createCustomerUser(data) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName ?? null,
      role: 'CUSTOMER',
      status: 'PENDING_VERIFICATION',
      passwordChangedAt: data.passwordChangedAt ?? new Date(),
    },
    select: publicUserSelect,
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: authUserSelect,
  });
}

export async function createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
  return prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function findEmailVerificationToken(tokenHash) {
  return prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: authUserSelect } },
  });
}

export async function markEmailVerificationUsed(id, usedAt = new Date()) {
  return prisma.emailVerificationToken.update({
    where: { id },
    data: { usedAt },
  });
}

export async function invalidateUnusedEmailVerificationTokens(userId) {
  return prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function createPasswordResetToken({ userId, tokenHash, expiresAt }) {
  return prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });
}

export async function findPasswordResetToken(tokenHash) {
  return prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: authUserSelect } },
  });
}

export async function markPasswordResetUsed(id, usedAt = new Date()) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt },
  });
}

export async function invalidateUnusedPasswordResetTokens(userId) {
  return prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function createRefreshToken(data) {
  return prisma.refreshToken.create({ data });
}

export async function findRefreshTokenByHash(tokenHash) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
  });
}

export async function revokeRefreshTokenFamily(familyId, revokedAt = new Date()) {
  return prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt },
  });
}

export async function revokeAllRefreshTokensForUser(userId, revokedAt = new Date()) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt },
  });
}

export async function rotateRefreshToken({ oldTokenId, familyId, userId, tokenHash, userAgent, ipAddress, expiresAt }) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    await tx.refreshToken.update({
      where: { id: oldTokenId },
      data: {
        revokedAt: new Date(),
        replacedById: created.id,
      },
    });

    return created;
  });
}

export async function markUserEmailVerified(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    select: publicUserSelect,
  });
}

export { publicUserSelect, authUserSelect };
