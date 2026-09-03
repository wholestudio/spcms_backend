import { PrismaClient } from '@prisma/client';
import { config } from '../config/config.js';
import { logger } from '../common/utils/logger.js';

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase() {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}
