export function buildPaginationMeta(total, page, limit) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(limit, 1);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && safePage < totalPages,
    hasPreviousPage: safePage > 1 && totalPages > 0,
  };
}

export function paginate(items, total, page, limit) {
  return {
    items,
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export function toSkipTake(page, limit) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(limit, 1);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
