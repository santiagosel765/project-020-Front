import api from "./axiosConfig";
import { Api } from "@/types/api";

export async function getRoles(params?: { all?: string | number }) {
  return (await api.get("/v1/roles", { params })).data as Api.Rol[];
}

export async function createRole(body: Api.CreateRolDto) {
  return (await api.post("/v1/roles", body)).data;
}

export async function updateRole(
  id: number,
  body: Partial<Api.CreateRolDto>,
) {
  return (await api.patch(`/v1/roles/${id}`, body)).data;
}

export async function deleteRole(id: number) {
  return (await api.delete(`/v1/roles/${id}`)).data;
}

export async function restoreRole(id: number) {
  return (await api.patch(`/v1/roles/${id}/restore`)).data;
}

export async function getRolePages(id: number) {
  return (
    await api.get<{ paginaIds: number[] }>(`/v1/roles/${id}/paginas`)
  ).data;
}

export async function setRolePages(id: number, paginaIds: number[]) {
  return (
    await api.put(`/v1/roles/${id}/paginas`, { paginaIds })
  ).data as { paginaIds: number[] };
}
