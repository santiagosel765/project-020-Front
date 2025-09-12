import api from '@/lib/axiosConfig';
import { Api } from '@/types/api';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export async function getPaginas(params?: { all?: string | number }) {
  const { data } = await api.get<Api.Pagina[]>("/paginas", { params });
  return normalizeList<Api.Pagina>(data);
}

export async function createPagina(body: Api.CreatePaginaDto) {
  const { data } = await api.post("/paginas", body);
  return normalizeOne<any>(data);
}

export async function updatePagina(
  id: number,
  body: Partial<Api.CreatePaginaDto>,
) {
  const { data } = await api.patch(`/paginas/${id}`, body);
  return normalizeOne<any>(data);
}

export async function deletePagina(id: number) {
  const { data } = await api.delete(`/paginas/${id}`);
  return normalizeOne<any>(data);
}

export async function restorePagina(id: number) {
  const { data } = await api.patch(`/paginas/${id}/restore`);
  return normalizeOne<any>(data);
}
