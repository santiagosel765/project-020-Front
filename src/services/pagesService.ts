import api from "./axiosConfig";
import { Api } from "@/types/api";

export async function getPaginas(params?: { all?: string | number }) {
  return (await api.get<Api.Pagina[]>("/paginas", { params })).data;
}

export async function createPagina(body: Api.CreatePaginaDto) {
  return (await api.post("/paginas", body)).data;
}

export async function updatePagina(
  id: number,
  body: Partial<Api.CreatePaginaDto>,
) {
  return (await api.patch(`/paginas/${id}`, body)).data;
}

export async function deletePagina(id: number) {
  return (await api.delete(`/paginas/${id}`)).data;
}

export async function restorePagina(id: number) {
  return (await api.patch(`/paginas/${id}/restore`)).data;
}
