import api from '@/lib/axiosConfig'
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope'

/**
 * Convierte de forma segura cualquier shape posible a number[]
 * - [1,2]
 * - [{ id: 1 }, { id: 2 }]
 * - { paginaIds: [1,2] }
 * - { data: { paginaIds: [1,2] } }
 * - cualquier otra cosa -> []
 */
const toNumberArray = (input: any): number[] => {
  // Array directo de números u objetos {id}
  if (Array.isArray(input)) {
    return input
      .map((x) => (typeof x === 'number' ? x : x?.id))
      .filter((n) => Number.isFinite(n))
  }
  // Objeto con paginaIds
  const ids = input?.paginaIds ?? input?.data?.paginaIds
  if (Array.isArray(ids)) {
    return ids.filter((n: any) => Number.isFinite(n))
  }
  return []
}

export async function getRoles(params?: { all?: string | number }) {
  const { data } = await api.get('/roles', { params })
  return normalizeList<any>(data)
}

export async function createRole(body: any) {
  const { data } = await api.post('/roles', body)
  return normalizeOne<any>(data)
}

export async function updateRole(id: number, body: Partial<any>) {
  const { data } = await api.patch(`/roles/${id}`, body)
  return normalizeOne<any>(data)
}

export async function deleteRole(id: number) {
  const { data } = await api.delete(`/roles/${id}`)
  return normalizeOne<any>(data)
}

export async function restoreRole(id: number) {
  const { data } = await api.patch(`/roles/${id}/restore`)
  return normalizeOne<any>(data)
}

/**
 * IMPORTANTE:
 * Siempre devuelve `number[]` para que el frontend
 * pueda usar Set/has sin romperse.
 */
export async function getRolePages(id: number): Promise<number[]> {
  const { data } = await api.get(`/roles/${id}/paginas`)
  const payload = normalizeOne<any>(data)
  return toNumberArray(payload)
}

/**
 * Devuelve siempre los ids finales (number[])
 */
export async function setRolePages(id: number, paginaIds: number[]): Promise<number[]> {
  const { data } = await api.put(`/roles/${id}/paginas`, { paginaIds })
  const payload = normalizeOne<any>(data)
  return toNumberArray(payload)
}
