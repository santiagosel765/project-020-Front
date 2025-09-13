import api from '@/lib/axiosConfig';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export async function getRoles(params?: { all?: string | number }) {
  const { data } = await api.get('/roles', { params });
  return normalizeList<any>(data);
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

export async function getRolePages(id: number): Promise<number[]> {
  const { data } = await api.get(`/roles/${id}/paginas`);
  const one = normalizeOne<{ paginaIds?: number[] }>(data);
  return Array.isArray(one.paginaIds) ? one.paginaIds : [];
}

export async function setRolePages(id: number, paginaIds: number[]): Promise<number[]> {
  const { data } = await api.put(`/roles/${id}/paginas`, { paginaIds });
  const one = normalizeOne<{ paginaIds?: number[] }>(data);
  return Array.isArray(one.paginaIds) ? one.paginaIds : [];
}
