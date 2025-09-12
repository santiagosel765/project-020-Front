import api from '@/lib/axiosConfig';
import { Api } from '@/types/api';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export async function getRoles(params?: { all?: string | number }) {
  const { data } = await api.get("/roles", { params });
  return normalizeList<Api.Rol>(data);
}

export async function createRole(body: Api.CreateRolDto) {
  const { data } = await api.post("/roles", body);
  return normalizeOne<any>(data);
}

export async function updateRole(
  id: number,
  body: Partial<Api.CreateRolDto>,
) {
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

export async function getRolePages(id: number) {
  const { data } = await api.get<{ paginaIds: number[] }>(`/roles/${id}/paginas`);
  return normalizeOne<{ paginaIds: number[] }>(data);
}

export async function setRolePages(id: number, paginaIds: number[]) {
  const { data } = await api.put(`/roles/${id}/paginas`, { paginaIds });
  return normalizeOne<{ paginaIds: number[] }>(data);
}
