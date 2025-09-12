import api from "./axiosConfig";
import { Api } from "@/types/api";

export async function getRoles(params?: { all?: string | number }) {
  return (await api.get("/roles", { params })).data as Api.Rol[];
}

export async function createRole(body: Api.CreateRolDto) {
  return (await api.post("/roles", body)).data;
}

export async function updateRole(
  id: number,
  body: Partial<Api.CreateRolDto>,
) {
  return (await api.patch(`/roles/${id}`, body)).data;
}

export async function deleteRole(id: number) {
  return (await api.delete(`/roles/${id}`)).data;
}

export async function restoreRole(id: number) {
  return (await api.patch(`/roles/${id}/restore`)).data;
}

export async function getRolePages(id: number) {
  return (
    await api.get<{ paginaIds: number[] }>(`/roles/${id}/paginas`)
  ).data;
}

export async function setRolePages(id: number, paginaIds: number[]) {
  return (
    await api.put(`/roles/${id}/paginas`, { paginaIds })
  ).data as { paginaIds: number[] };
}
