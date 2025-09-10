import api from '@/lib/axiosConfig';

export interface Page {
  id?: number;
  nombre: string;
  url: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
}

function mapPageFromApi(p: any): Page {
  return {
    id: p.id,
    nombre: p.nombre,
    url: p.url,
    descripcion: p.descripcion,
    activo: p.activo,
    createdAt: p.created_at || p.createdAt,
  };
}

function mapPageToApi(p: Partial<Page>) {
  return {
    ...(p.nombre !== undefined && { nombre: p.nombre }),
    ...(p.url !== undefined && { url: p.url }),
    ...(p.descripcion !== undefined && { descripcion: p.descripcion }),
  };
}

export async function getPages(all = false): Promise<Page[]> {
  const res = await api.get(`/paginas?all=${all ? 1 : 0}`);
  return Array.isArray(res.data) ? res.data.map(mapPageFromApi) : [];
}

export async function createPage(page: Omit<Page, 'id' | 'activo' | 'createdAt'>): Promise<Page> {
  const res = await api.post('/paginas', mapPageToApi(page));
  return mapPageFromApi(res.data);
}

export async function updatePage(id: number, page: Partial<Page>): Promise<Page> {
  const res = await api.patch(`/paginas/${id}`, mapPageToApi(page));
  return mapPageFromApi(res.data);
}

export async function deletePage(id: number): Promise<void> {
  await api.delete(`/paginas/${id}`);
}

export async function restorePage(id: number): Promise<Page> {
  const res = await api.patch(`/paginas/${id}/restore`);
  return mapPageFromApi(res.data);
}

export async function getRolePages(roleId: string): Promise<number[]> {
  const res = await api.get(`/roles/${roleId}/paginas`);
  return Array.isArray(res.data?.paginaIds)
    ? res.data.paginaIds
    : Array.isArray(res.data)
      ? res.data
      : [];
}

export async function updateRolePages(roleId: string, paginaIds: number[]): Promise<void> {
  await api.put(`/roles/${roleId}/paginas`, { paginaIds });
}

