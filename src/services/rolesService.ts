import { api } from '@/lib/api';
import { normalizeOne } from '@/lib/apiEnvelope';
import { PageEnvelope } from '@/lib/pagination';
import { buildListQuery, type ListParams } from '@/services/http-helpers';

export interface Role {
  id?: string | number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt?: string;
}

export type GetRolesParams = ListParams;

const toRole = (role: any): Role => ({
  id: role?.id,
  nombre: role?.nombre ?? role?.name ?? '',
  descripcion: role?.descripcion ?? role?.description ?? undefined,
  activo: role?.activo ?? role?.active ?? undefined,
  createdAt: role?.createdAt ?? role?.created_at ?? undefined,
});

export async function getRoles(params: GetRolesParams = {}): Promise<PageEnvelope<Role>> {
  const query = buildListQuery(params);
  const url = query.length > 0 ? `/roles?${query}` : '/roles';
  const { data } = await api.get<PageEnvelope<any>>(url);
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
