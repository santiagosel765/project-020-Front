import { api } from '@/lib/api';
import { normalizeOne } from '@/lib/apiEnvelope';
import { PageEnvelope } from '@/lib/pagination';

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
  sort?: 'asc' | 'desc';
  search?: string;
  showInactive?: boolean;
  [key: string]: unknown;
}

const toPagina = (page: any): PaginaUI => ({
  id: Number(page?.id ?? 0),
  nombre: page?.nombre ?? '',
  url: page?.url ?? '',
  descripcion: page?.descripcion ?? page?.description ?? undefined,
  createdAt: page?.createdAt ?? page?.created_at ?? undefined,
  activo: page?.activo ?? page?.active ?? undefined,
});

export async function getPaginas(params: GetPagesParams = {}): Promise<PageEnvelope<PaginaUI>> {
  const {
    page = 1,
    limit = 10,
    sort = 'desc',
    search,
    showInactive = false,
    ...rest
  } = params;

  const query: Record<string, unknown> = {
    page,
    limit,
    sort,
    showInactive,
    ...rest,
  };

  if (typeof search === 'string' && search.trim() !== '') {
    query.search = search.trim();
  }

  const { data } = await api.get<PageEnvelope<any>>('/paginas', { params: query });
  const envelope = data as PageEnvelope<any>;
  const items = Array.isArray(envelope.items) ? envelope.items.map(toPagina) : [];

  return {
    ...envelope,
    items,
  };
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
