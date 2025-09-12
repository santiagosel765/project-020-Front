import api from "./axiosConfig";
import { Api } from "@/types/api";

export async function getPaginas(params?: { all?: string | number }) {
  return (await api.get<Api.Pagina[]>("/v1/paginas", { params })).data;
}

export async function createPagina(body: Api.CreatePaginaDto) {
  return (await api.post("/v1/paginas", body)).data;
}

export async function updatePagina(
  id: number,
  body: Partial<Api.CreatePaginaDto>,
) {
  return (await api.patch(`/v1/paginas/${id}`, body)).data;
}

export async function deletePagina(id: number) {
  return (await api.delete(`/v1/paginas/${id}`)).data;
}

export async function restorePagina(id: number) {
  return (await api.patch(`/v1/paginas/${id}/restore`)).data;
}
