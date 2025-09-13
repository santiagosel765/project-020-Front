export type Paginated<T> = {
  items: T[];
  meta?: {
    totalPages?: number;
    totalCount?: number;
    page?: number;
    limit?: number;
    lastPage?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

/** Devuelve un array pase lo que pase */
export function unwrapArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data as T[];
    if (Array.isArray(payload.result)) return payload.result as T[];
    // Caso {status, data:{items|documentos:[...]}}
    const d = payload.data ?? payload.result ?? payload.body;
    if (d && Array.isArray(d.items)) return d.items as T[];
    if (d && Array.isArray(d.documentos)) return d.documentos as T[];
  }
  return [];
}

/** Devuelve un objeto (o {} si no hay) */
export function unwrapOne<T = unknown>(payload: any): T {
  if (payload && typeof payload === 'object') {
    const d = payload.data ?? payload.result ?? payload.body ?? payload;
    if (d && !Array.isArray(d)) return d as T;
  }
  return {} as T;
}

/** Extrae paginación estandarizando nombres */
export function unwrapPaginated<T = unknown>(payload: any): Paginated<T> {
  const items = unwrapArray<T>(payload);
  const raw = (payload?.data ?? payload?.result ?? payload) as any;
  const meta =
    raw?.meta ?? {
      totalPages: raw?.totalPages,
      totalCount: raw?.totalCount,
      page: raw?.page,
      limit: raw?.limit,
      lastPage: raw?.lastPage,
      hasNextPage: raw?.hasNextPage,
      hasPrevPage: raw?.hasPrevPage,
    };
  return { items, meta };
}

/** Azúcar: normaliza lista/uno aceptando cualquier envoltura */
export const normalizeList = unwrapArray;
export const normalizeOne = unwrapOne;
