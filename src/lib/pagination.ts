export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PageEnvelope<T> {
  items: T[];
  page: number;
  limit: number;
  sort: 'asc' | 'desc';
  total: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

const META_NUMBER_KEYS = [
  'total',
  'totalCount',
  'count',
  'totalItems',
  'itemCount',
  'limit',
  'perPage',
  'pageSize',
  'itemsPerPage',
  'page',
  'currentPage',
  'pageIndex',
  'pages',
  'totalPages',
  'lastPage',
  'pageCount',
];

const DEFAULT_LIMIT = 10;

export const hasPaginationMeta = (meta: unknown): meta is Record<string, unknown> => {
  if (!meta || typeof meta !== 'object') return false;
  return META_NUMBER_KEYS.some((key) => {
    const value = (meta as Record<string, unknown>)[key];
    return typeof value === 'number' && Number.isFinite(value);
  });
};

const toPositiveInteger = (value: unknown, fallback: number): number => {
  const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

const clampPage = (page: number, pages: number) => {
  if (pages <= 0) return 1;
  if (page < 1) return 1;
  if (page > pages) return pages;
  return page;
};

export const normalizePaginationMeta = (
  meta: Record<string, unknown> | undefined,
  fallback: { total?: number; page?: number; limit?: number } = {},
): PaginationMeta => {
  const rawTotal =
    meta?.total ??
    meta?.totalCount ??
    meta?.count ??
    meta?.totalItems ??
    meta?.itemCount ??
    fallback.total ??
    0;
  const rawLimit =
    meta?.limit ??
    meta?.perPage ??
    meta?.pageSize ??
    meta?.itemsPerPage ??
    fallback.limit ??
    DEFAULT_LIMIT;
  const rawPage = meta?.page ?? meta?.currentPage ?? meta?.pageIndex ?? fallback.page ?? 1;
  const rawPages =
    meta?.pages ??
    meta?.totalPages ??
    meta?.lastPage ??
    meta?.pageCount ??
    (rawLimit ? Math.ceil(Number(rawTotal) / Number(rawLimit)) : undefined);

  const limit = toPositiveInteger(rawLimit, fallback.limit ?? DEFAULT_LIMIT);
  const total = Math.max(0, Math.floor(Number(rawTotal) || 0));
  const pages = Math.max(1, toPositiveInteger(rawPages, Math.ceil(total / limit) || 1));
  const page = clampPage(toPositiveInteger(rawPage, fallback.page ?? 1), pages);

  return {
    total,
    page,
    limit,
    pages,
    lastPage: pages,
    hasNextPage: page < pages,
    hasPrevPage: page > 1,
  };
};

export const paginateArray = <T>(
  source: T[],
  options: { page?: number; limit?: number } = {},
): PaginatedResult<T> => {
  const limit = toPositiveInteger(options.limit, DEFAULT_LIMIT);
  const total = source.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  const page = clampPage(toPositiveInteger(options.page, 1), pages);
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = source.slice(start, end);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      pages,
      lastPage: pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    },
  };
};

