import { api } from '@/lib/api';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export interface PaginaUI {
  id: number;
  nombre: string;
  url: string;
  descripcion?: string;
  createdAt?: string;
  activo?: boolean;
}
export async function getPaginas(params?: any): Promise<PaginaUI[]> {
  const { data } = await api.get('/paginas', { params });
  return normalizeList<PaginaUI>(data);
}

export async function createPagina(body: any): Promise<PaginaUI> {
  const { data } = await api.post('/paginas', body);
  return normalizeOne<PaginaUI>(data);
}
export async function updatePagina(id: number, body: any): Promise<PaginaUI> {
  const { data } = await api.patch(`/paginas/${id}`, body);
  return normalizeOne<PaginaUI>(data);
}
export async function deletePagina(id: number): Promise<PaginaUI> {
  const { data } = await api.delete(`/paginas/${id}`);
  return normalizeOne<PaginaUI>(data);
}
export async function restorePagina(id: number): Promise<PaginaUI> {
  const { data } = await api.patch(`/paginas/${id}/restore`);
  return normalizeOne<PaginaUI>(data);
}
