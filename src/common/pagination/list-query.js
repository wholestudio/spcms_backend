const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse list query params for filtering, sorting, search, and pagination.
 * Keep this simple — domain-specific filters belong in module validators.
 */
export function parseListQuery(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || DEFAULT_PAGE, 1);
  const requestedLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const search = typeof query.search === 'string' ? query.search.trim() : undefined;
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy.trim() : undefined;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    search: search || undefined,
    sortBy: sortBy || undefined,
    sortOrder,
  };
}

export const LIST_QUERY_DEFAULTS = Object.freeze({
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  maxLimit: MAX_LIMIT,
});
