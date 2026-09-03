import {
  buildPaginationMeta,
  paginate,
  toSkipTake,
} from '../../src/common/pagination/pagination.js';
import { parseListQuery } from '../../src/common/pagination/list-query.js';

describe('pagination', () => {
  it('builds metadata with next and previous flags', () => {
    const meta = buildPaginationMeta(95, 2, 10);
    expect(meta).toMatchObject({
      page: 2,
      limit: 10,
      offset: 10,
      total: 95,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('handles an empty collection', () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('converts page/limit to skip/take', () => {
    expect(toSkipTake(3, 25)).toEqual({ skip: 50, take: 25 });
  });

  it('wraps items with pagination', () => {
    const result = paginate(['a'], 1, 1, 20);
    expect(result.items).toEqual(['a']);
    expect(result.pagination.total).toBe(1);
  });
});

describe('parseListQuery', () => {
  it('applies defaults and offset', () => {
    const parsed = parseListQuery({});
    expect(parsed).toMatchObject({
      page: 1,
      limit: 20,
      offset: 0,
      sortOrder: 'desc',
    });
  });

  it('caps limit and parses search/sort', () => {
    const parsed = parseListQuery({
      page: '2',
      limit: '500',
      search: '  oak  ',
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(100);
    expect(parsed.search).toBe('oak');
    expect(parsed.sortBy).toBe('createdAt');
    expect(parsed.sortOrder).toBe('asc');
  });
});
