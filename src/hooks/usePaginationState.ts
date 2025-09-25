"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pageDebug } from "@/lib/page-debug";

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
  defaultSearch?: string;
  defaultIncludeInactive?: boolean;
}

export const usePaginationState = (options: PaginationStateOptions = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUserPagingRef = useRef(false);

  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const defaultSort = options.defaultSort ?? "desc";
  const defaultSearch = options.defaultSearch ?? "";
  const defaultIncludeInactive = options.defaultIncludeInactive ?? false;

  const parseIncludeInactive = useCallback(
    (raw: string | null | undefined): boolean => {
      if (typeof raw === "string") {
        const normalized = raw.trim().toLowerCase();
        if (normalized === "true" || normalized === "1") return true;
        if (normalized === "false" || normalized === "0") return false;
      }
      return defaultIncludeInactive;
    },
    [defaultIncludeInactive],
  );

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

  const search = useMemo(
    () => {
      const raw = searchParams?.get("search");
      return typeof raw === "string" ? raw : defaultSearch;
    },
    [defaultSearch, searchParams],
  );

  const includeInactive = useMemo(() => {
    const preferred = searchParams?.get("includeInactive");
    if (preferred != null) return parseIncludeInactive(preferred);
    const legacy = searchParams?.get("all");
    if (legacy != null) return parseIncludeInactive(legacy);
    return defaultIncludeInactive;
  }, [defaultIncludeInactive, parseIncludeInactive, searchParams]);

  const commit = useCallback(
    (next: {
      page?: number;
      limit?: number;
      sort?: SortOrder;
      search?: string;
      includeInactive?: boolean;
    }) => {
      const nextPage = parsePositiveInteger(next.page ?? page, defaultPage);
      const nextLimit = parsePositiveInteger(next.limit ?? limit, defaultLimit);
      const nextSort = sanitizeSort(next.sort ?? sort, defaultSort);
      const nextSearch = typeof next.search === "string" ? next.search : search;
      const nextIncludeInactive =
        typeof next.includeInactive === "boolean" ? next.includeInactive : includeInactive;

      pageDebug("src/hooks/usePaginationState.ts:commit", {
        from: { page, limit, sort, search, includeInactive },
        to: {
          page: nextPage,
          limit: nextLimit,
          sort: nextSort,
          search: nextSearch,
          includeInactive: nextIncludeInactive,
        },
      });

      if (
        nextPage === page &&
        nextLimit === limit &&
        nextSort === sort &&
        nextSearch === search &&
        nextIncludeInactive === includeInactive
      )
        return;

      const params = new URLSearchParams(searchParams?.toString());
      params.set("page", String(nextPage));
      params.set("limit", String(nextLimit));
      params.set("sort", nextSort);
      params.set("includeInactive", String(nextIncludeInactive));
      params.set("all", nextIncludeInactive ? "1" : "0");

      if (typeof nextSearch === "string" && nextSearch.length > 0) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [
      defaultLimit,
      defaultPage,
      defaultSearch,
      defaultSort,
      includeInactive,
      limit,
      page,
      router,
      search,
      searchParams,
      sort,
    ],
  );

  const setPage = useCallback(
    (value: number) => {
      if (!Number.isFinite(value)) return;
      const target = Math.max(1, Math.floor(value));
      pageDebug("src/hooks/usePaginationState.ts:setPage", {
        from: page,
        to: target,
      });
      isUserPagingRef.current = true;
      commit({ page: target });
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          isUserPagingRef.current = false;
        }, 0);
      } else {
        isUserPagingRef.current = false;
      }
    },
    [commit, page],
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

  const setSearch = useCallback(
    (value: string) => {
      commit({ search: typeof value === "string" ? value : "" });
    },
    [commit],
  );

  const setIncludeInactive = useCallback(
    (value: boolean) => {
      commit({ includeInactive: Boolean(value) });
    },
    [commit],
  );

  const params = useMemo(
    () => ({
      page,
      limit,
      sort,
      search,
      includeInactive,
    }),
    [includeInactive, limit, page, search, sort],
  );

  const queryString = useMemo(() => {
    const url = new URLSearchParams();
    url.set("page", String(page));
    url.set("limit", String(limit));
    url.set("sort", sort);
    url.set("includeInactive", String(includeInactive));
    url.set("all", includeInactive ? "1" : "0");
    if (typeof search === "string" && search.length > 0) {
      url.set("search", search);
    }
    return url.toString();
  }, [includeInactive, limit, page, search, sort]);

  return {
    page,
    limit,
    sort,
    search,
    includeInactive,
    setPage,
    setLimit,
    setSort,
    setSearch,
    setIncludeInactive,
    toggleSort,
    params,
    queryString,
    isUserPagingRef,
  } as const;
};

export const useServerPagination = usePaginationState;
