import { api } from '@/lib/api';
import { normalizeList, normalizeOne, unwrapPaginated } from '@/lib/apiEnvelope';
import { hasPaginationMeta, normalizePaginationMeta, paginateArray, type PaginatedResult } from '@/lib/pagination';

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
  search?: string;
  showInactive?: boolean;
  [key: string]: unknown;
}

const filterRoles = (roles: Role[], search: string, showInactive: boolean) => {
  const term = search.trim().toLowerCase();
  return roles
    .filter((role) => {
      if (!showInactive && role.activo === false) return false;
      if (!term) return true;
      const name = (role.nombre ?? '').toLowerCase();
      const description = (role.descripcion ?? '').toLowerCase();
      return name.includes(term) || description.includes(term);
    })
    .sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
};

export async function getRoles(params: GetRolesParams = {}): Promise<PaginatedResult<Role>> {
  const { page = 1, limit = 10, search = '', showInactive = false, ...rest } = params;
  const query: Record<string, unknown> = { ...rest };
  if (params.page != null) query.page = page;
  if (params.limit != null) query.limit = limit;
  if (search.trim() !== '') query.search = search.trim();

  const { data } = await api.get('/roles', { params: query });
  const pag = unwrapPaginated<Role>(data);
  if (hasPaginationMeta(pag.meta)) {
    const meta = normalizePaginationMeta(pag.meta, { page, limit });
    const items = (pag.items.length ? pag.items : normalizeList<Role>(data)) as Role[];
    return { items, meta };
  }

  const list = normalizeList<Role>(data);
  const filtered = filterRoles(list, search, showInactive);
  return paginateArray(filtered, { page, limit });
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
