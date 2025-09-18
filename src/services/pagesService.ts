import { api } from '@/lib/api';
import { normalizeList, normalizeOne, unwrapPaginated } from '@/lib/apiEnvelope';
import { hasPaginationMeta, normalizePaginationMeta, paginateArray, type PaginatedResult } from '@/lib/pagination';

export interface PaginaUI {
  id: number;
  nombre: string;
  url: string;
  descripcion?: string;
  createdAt?: string;
  activo?: boolean;
}
export interface GetPagesParams {
  page?: number;
  limit?: number;
  search?: string;
  showInactive?: boolean;
  [key: string]: unknown;
}

const filterPages = (pages: PaginaUI[], search: string, showInactive: boolean) => {
  const term = search.trim().toLowerCase();
  return pages
    .filter((page) => {
      if (!showInactive && page.activo === false) return false;
      if (!term) return true;
      const nombre = (page.nombre ?? '').toLowerCase();
      const descripcion = (page.descripcion ?? '').toLowerCase();
      const url = (page.url ?? '').toLowerCase();
      return nombre.includes(term) || descripcion.includes(term) || url.includes(term);
    })
    .sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
};

export async function getPaginas(params: GetPagesParams = {}): Promise<PaginatedResult<PaginaUI>> {
  const { page = 1, limit = 10, search = '', showInactive = false, ...rest } = params;
  const query: Record<string, unknown> = { ...rest };
  if (params.page != null) query.page = page;
  if (params.limit != null) query.limit = limit;
  if (search.trim() !== '') query.search = search.trim();

  const { data } = await api.get('/paginas', { params: query });
  const pag = unwrapPaginated<PaginaUI>(data);
  if (hasPaginationMeta(pag.meta)) {
    const meta = normalizePaginationMeta(pag.meta, { page, limit });
    const items = (pag.items.length ? pag.items : normalizeList<PaginaUI>(data)) as PaginaUI[];
    return { items, meta };
  }

  const list = normalizeList<PaginaUI>(data);
  const filtered = filterPages(list, search, showInactive);
  return paginateArray(filtered, { page, limit });
}

export async function createPagina(body: any): Promise<PaginaUI> {
  const { data } = await api.post('/paginas', body);
  return normalizeOne<PaginaUI>(data);
}
export async function updatePagina(id: number, body: any): Promise<PaginaUI> {
  const { data } = await api.patch(`/paginas/${id}`, body);
  return normalizeOne<PaginaUI>(data);
}
export async function deletePagina(id: number): Promise<PaginaUI> {
  const { data } = await api.delete(`/paginas/${id}`);
  return normalizeOne<PaginaUI>(data);
}
export async function restorePagina(id: number): Promise<PaginaUI> {
  const { data } = await api.patch(`/paginas/${id}/restore`);
  return normalizeOne<PaginaUI>(data);
}
