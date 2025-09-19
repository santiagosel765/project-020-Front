"use client";

export interface PageDebugPayload {
  from?: unknown;
  to?: unknown;
  locationSearch?: string;
  [key: string]: unknown;
}

export const pageDebug = (label: string, payload: PageDebugPayload = {}) => {
  if (process.env.NEXT_PUBLIC_PAGE_DEBUG !== "1") return;

  const locationSearch =
    typeof window !== "undefined" ? window.location.search : payload.locationSearch;

  const entry = {
    label,
    data: {
      ...payload,
      from: payload.from,
      to: payload.to,
      locationSearch,
    },
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    const storeKey = "__PAGE_DEBUG_LOGS__";
    const globalAny = window as unknown as Record<string, unknown>;
    const store = (globalAny[storeKey] as unknown[]) ?? [];
    store.push(entry);
    globalAny[storeKey] = store;
  }

  console.debug("[PAGE_DEBUG]", entry.label, entry.data);
};
