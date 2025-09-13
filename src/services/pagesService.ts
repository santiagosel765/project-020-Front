import api from '@/lib/axiosConfig'
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope'

export interface Pagina {
  id: number
  nombre: string
  url: string
  descripcion?: string | null
  activo?: boolean | null
  add_date?: string
  updated_at?: string
}

export async function getPaginas(params?: { all?: string | number }): Promise<Pagina[]> {
  const { data } = await api.get('/paginas', { params })
  const list = normalizeList<Pagina>(data)
  // Garantiza array aunque el backend devuelva envelope u objeto
  return Array.isArray(list) ? list : []
}

export async function createPagina(body: any) {
  const { data } = await api.post('/paginas', body)
  return normalizeOne<any>(data)
}

export async function updatePagina(id: number, body: Partial<any>) {
  const { data } = await api.patch(`/paginas/${id}`, body)
  return normalizeOne<any>(data)
}

export async function deletePagina(id: number) {
  const { data } = await api.delete(`/paginas/${id}`)
  return normalizeOne<any>(data)
}

export async function restorePagina(id: number) {
  const { data } = await api.patch(`/paginas/${id}/restore`)
  return normalizeOne<any>(data)
}
