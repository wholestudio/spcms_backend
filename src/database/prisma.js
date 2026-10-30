import { PrismaClient } from '@prisma/client';
import { config } from '../config/config.js';
import { logger } from '../common/utils/logger.js';

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['warn', 'error'] : ['error'],
});

const CONNECT_ATTEMPTS = 5;
const CONNECT_RETRY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase() {
  let lastError;

  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      logger.info({ attempt }, 'PostgreSQL connected via Prisma');
      return true;
    } catch (error) {
      lastError = error;
      logger.warn(
        { err: error, attempt, attempts: CONNECT_ATTEMPTS },
        'PostgreSQL connect attempt failed',
      );

      if (attempt < CONNECT_ATTEMPTS) {
        await sleep(CONNECT_RETRY_MS * attempt);
      }
    }
  }

  if (config.isProduction) {
    throw lastError;
  }

  logger.warn(
    { err: lastError },
    'PostgreSQL is unavailable after retries. Auth and DB-backed routes will fail until Neon/Postgres is reachable. Check DATABASE_URL (Neon pooler needs pgbouncer=true).',
  );
  return false;
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('PostgreSQL disconnected');
  } catch (error) {
    logger.warn({ err: error }, 'PostgreSQL disconnect skipped');
  }
}
