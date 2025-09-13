import api from '@/lib/axiosConfig';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export async function getPaginas(params?: { all?: string | number }) {
  const { data } = await api.get('/paginas', { params });
  return normalizeList<any>(data);
}

export async function createPagina(body: any) {
  const { data } = await api.post('/paginas', body);
  return normalizeOne<any>(data);
}
export async function updatePagina(id: number, body: any) {
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
