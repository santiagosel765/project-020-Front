"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PaginationMeta } from "@/lib/pagination";

type MetaLike =
  | PaginationMeta
  | (Partial<{
      page: number;
      currentPage: number;
      pageIndex: number;
      limit: number;
      perPage: number;
      pageSize: number;
      itemsPerPage: number;
      pages: number;
      totalPages: number;
      lastPage: number;
      pageCount: number;
    }> &
      Record<string, unknown>);

const DEFAULT_LIMIT = 10;

const parseParam = (value: string | null | undefined, fallback: number): number => {
  if (value == null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const clampPage = (page: number) => {
  if (!Number.isFinite(page) || page <= 0) return 1;
  return Math.floor(page);
};

const pickMetaNumber = (meta: MetaLike | undefined, keys: string[]): number | undefined => {
  if (!meta) return undefined;
  const record = meta as Record<string, unknown>;
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
};

export const useServerPagination = (defaults: { page?: number; limit?: number } = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPage = clampPage(parseParam(searchParams?.get("page"), defaults.page ?? 1));
  const initialLimit = parseParam(searchParams?.get("limit"), defaults.limit ?? DEFAULT_LIMIT);

  const [state, setState] = useState({ page: initialPage, limit: initialLimit });

  const storageKey = useMemo(() => `pagination:${pathname}`, [pathname]);

  const updateUrl = useCallback(
    (nextPage: number, nextLimit: number, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("page", String(nextPage));
      params.set("limit", String(nextLimit));
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      const method = options?.replace ? router.replace : router.push;
      method(url, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const pageParam = searchParams?.get("page");
    const limitParam = searchParams?.get("limit");
    setState((prev) => {
      const nextPage = clampPage(parseParam(pageParam, prev.page));
      const nextLimit = parseParam(limitParam, prev.limit);
      if (nextPage === prev.page && nextLimit === prev.limit) return prev;
      return { page: nextPage, limit: nextLimit };
    });
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams?.has("limit")) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { limit?: unknown } | null;
      const storedLimit = parseParam(
        parsed && typeof parsed.limit !== "string" ? String(parsed.limit ?? "") : (parsed?.limit as string | undefined),
        state.limit,
      );
      if (!storedLimit || storedLimit === state.limit) return;
      setState((prev) => {
        if (prev.limit === storedLimit) return prev;
        updateUrl(prev.page, storedLimit, { replace: true });
        return { page: prev.page, limit: storedLimit };
      });
    } catch {
      /* ignore storage errors */
    }
  }, [searchParams, state.limit, storageKey, updateUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ limit: state.limit }));
    } catch {
      /* ignore storage errors */
    }
  }, [state.limit, storageKey]);

  const setPage = useCallback(
    (nextPage: number) => {
      setState((prev) => {
        const pageValue = clampPage(nextPage);
        if (pageValue === prev.page) return prev;
        updateUrl(pageValue, prev.limit);
        return { ...prev, page: pageValue };
      });
    },
    [updateUrl],
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      setState((prev) => {
        const limitValue = parseParam(String(nextLimit), DEFAULT_LIMIT);
        if (limitValue === prev.limit && prev.page === 1) return prev;
        updateUrl(1, limitValue);
        return { page: 1, limit: limitValue };
      });
    },
    [updateUrl],
  );

  const setFromMeta = useCallback(
    (meta?: MetaLike | null) => {
      if (!meta) return;
      setState((prev) => {
        const metaLimit = pickMetaNumber(meta, ["limit", "perPage", "pageSize", "itemsPerPage"]);
        const metaPage = pickMetaNumber(meta, ["page", "currentPage", "pageIndex"]);
        const metaPages = pickMetaNumber(meta, ["pages", "totalPages", "lastPage", "pageCount"]);

        let nextLimit = prev.limit;
        if (metaLimit && metaLimit > 0) nextLimit = Math.floor(metaLimit);

        let nextPage = prev.page;
        if (metaPage && metaPage > 0) nextPage = Math.floor(metaPage);
        if (metaPages && metaPages > 0 && nextPage > metaPages) nextPage = Math.floor(metaPages);
        if (nextPage <= 0) nextPage = 1;

        if (nextPage === prev.page && nextLimit === prev.limit) return prev;
        updateUrl(nextPage, nextLimit, { replace: true });
        return { page: nextPage, limit: nextLimit };
      });
    },
    [updateUrl],
  );

  const params = useMemo(() => ({ page: state.page, limit: state.limit }), [state.page, state.limit]);

  return {
    page: state.page,
    limit: state.limit,
    setPage,
    setLimit,
    params,
    setFromMeta,
  } as const;
};

