/**
 * Idempotent SUPER_ADMIN seed.
 * Reads BOOTSTRAP_ADMIN_* from the environment. Never logs the password.
 */
import { prisma } from '../src/database/prisma.js';
import { hashPassword } from '../src/common/utils/password.js';
import { ROLES } from '../src/common/constants/roles.js';
import { loadEnv } from '../src/config/env.js';

function splitDisplayName(name) {
  const trimmed = name.trim();
  const space = trimmed.indexOf(' ');
  if (space === -1) {
    return { firstName: trimmed, lastName: null };
  }
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim() || null,
  };
}

async function main() {
  const env = loadEnv();

  const email = env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = env.BOOTSTRAP_ADMIN_NAME;

  if (!email) {
    throw new Error('BOOTSTRAP_ADMIN_EMAIL is required to seed a super admin');
  }
  if (!password || password.length < 8) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters');
  }

  const { firstName, lastName } = splitDisplayName(displayName);
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: ROLES.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerifiedAt: now,
      passwordChangedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    update: {
      passwordHash,
      firstName,
      lastName,
      role: ROLES.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerifiedAt: now,
      passwordChangedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`Super admin ready: ${user.email} (${user.role}, ${user.status}, id=${user.id})`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
