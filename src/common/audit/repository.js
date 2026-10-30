import { prisma } from '../../database/index.js';

export async function createAuditLog({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      metadata: metadata ?? undefined,
    },
  });
}
