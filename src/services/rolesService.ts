import { api } from '@/lib/api';
import { normalizeOne } from '@/lib/apiEnvelope';
import { PageEnvelope } from '@/lib/pagination';

export interface Role {
  id?: string | number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface GetRolesParams {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  search?: string;
  showInactive?: boolean;
  [key: string]: unknown;
}

const toRole = (role: any): Role => ({
  id: role?.id,
  nombre: role?.nombre ?? role?.name ?? '',
  descripcion: role?.descripcion ?? role?.description ?? undefined,
  activo: role?.activo ?? role?.active ?? undefined,
  createdAt: role?.createdAt ?? role?.created_at ?? undefined,
});

export async function getRoles(params: GetRolesParams = {}): Promise<PageEnvelope<Role>> {
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

  const { data } = await api.get<PageEnvelope<any>>('/roles', { params: query });
  const envelope = data as PageEnvelope<any>;
  const items = Array.isArray(envelope.items) ? envelope.items.map(toRole) : [];

  return {
    ...envelope,
    items,
  };
}

export async function createRole(body: any) {
  const { data } = await api.post('/roles', body);
  return normalizeOne<any>(data);
}

export async function updateRole(id: number, body: any) {
  const { data } = await api.patch(`/roles/${id}`, body);
  return normalizeOne<any>(data);
}

export async function deleteRole(id: number) {
  const { data } = await api.delete(`/roles/${id}`);
  return normalizeOne<any>(data);
}

export async function restoreRole(id: number) {
  const { data } = await api.patch(`/roles/${id}/restore`);
  return normalizeOne<any>(data);
}

export async function getRolePages(id: string | number): Promise<number[]> {
  const { data } = await api.get(`/roles/${id}/paginas`);
  const one = normalizeOne<{ paginaIds?: number[] }>(data);
  return Array.isArray(one.paginaIds) ? one.paginaIds : [];
}

export async function setRolePages(id: string | number, paginaIds: number[]): Promise<number[]> {
  const { data } = await api.put(`/roles/${id}/paginas`, { paginaIds });
  const one = normalizeOne<{ paginaIds?: number[] }>(data);
  return Array.isArray(one.paginaIds) ? one.paginaIds : [];
}
