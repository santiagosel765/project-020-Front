"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_LIMIT = 10;

const parsePositiveInteger = (value: string | number | null | undefined, fallback: number) => {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.floor(numeric);
};

export type SortOrder = "asc" | "desc";

const sanitizeSort = (
  value: string | null | undefined,
  fallback: SortOrder,
): SortOrder => {
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "asc" || trimmed === "desc") {
      return trimmed;
    }
  }
  return fallback;
};

export interface PaginationStateOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultSort?: SortOrder;
}

export const usePaginationState = (options: PaginationStateOptions = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const defaultSort = options.defaultSort ?? "desc";

  const page = useMemo(
    () => parsePositiveInteger(searchParams?.get("page"), defaultPage),
    [defaultPage, searchParams],
  );

  const limit = useMemo(
    () => parsePositiveInteger(searchParams?.get("limit"), defaultLimit),
    [defaultLimit, searchParams],
  );

  const sort = useMemo(
    () => sanitizeSort(searchParams?.get("sort"), defaultSort),
    [defaultSort, searchParams],
  );

  const commit = useCallback(
    (next: { page?: number; limit?: number; sort?: SortOrder }) => {
      const nextPage = parsePositiveInteger(next.page ?? page, defaultPage);
      const nextLimit = parsePositiveInteger(next.limit ?? limit, defaultLimit);
      const nextSort = sanitizeSort(next.sort ?? sort, defaultSort);

      if (nextPage === page && nextLimit === limit && nextSort === sort) return;

      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(nextLimit));
      params.set("sort", nextSort);

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [defaultLimit, defaultPage, defaultSort, limit, page, router, sort],
  );

  const setPage = useCallback(
    (value: number) => {
      commit({ page: value });
    },
    [commit],
  );

  const setLimit = useCallback(
    (value: number) => {
      commit({ limit: value, page: 1 });
    },
    [commit],
  );

  const setSort = useCallback(
    (value: SortOrder) => {
      commit({ sort: value });
    },
    [commit],
  );

  const toggleSort = useCallback(() => {
    commit({ sort: sort === "asc" ? "desc" : "asc" });
  }, [commit, sort]);

  const params = useMemo(
    () => ({
      page,
      limit,
      sort,
    }),
    [limit, page, sort],
  );

  const queryString = useMemo(() => {
    const url = new URLSearchParams();
    url.set("page", String(page));
    url.set("limit", String(limit));
    url.set("sort", sort);
    return url.toString();
  }, [limit, page, sort]);

  return {
    page,
    limit,
    sort,
    setPage,
    setLimit,
    setSort,
    toggleSort,
    params,
    queryString,
  } as const;
};

export const useServerPagination = usePaginationState;
