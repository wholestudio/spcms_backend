import { prisma } from '../../database/index.js';
import { toSkipTake } from '../../common/pagination/pagination.js';

export async function createMedia(data) {
  return prisma.media.create({ data });
}

export async function findMediaById(id) {
  return prisma.media.findUnique({ where: { id } });
}

export async function findMediaMany({ entityType, entityId, folder, page = 1, limit = 20 }) {
  const where = {};

  if (entityType) {
    where.entityType = entityType;
  }
  if (entityId) {
    where.entityId = entityId;
  }
  if (folder) {
    where.folder = folder;
  }

  const { skip, take } = toSkipTake(page, limit);

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.media.count({ where }),
  ]);

  return { items, total };
}

export async function updateMediaById(id, data) {
  return prisma.media.update({
    where: { id },
    data,
  });
}

export async function deleteMediaById(id) {
  return prisma.media.delete({ where: { id } });
}
