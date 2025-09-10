import api from '@/lib/axiosConfig';

export interface Role {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
}

function mapRoleFromApi(r: any): Role {
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    activo: r.activo,
    createdAt: r.created_at || r.createdAt,
  };
}

function mapRoleToApi(r: Partial<Role>) {
  return {
    ...(r.nombre !== undefined && { nombre: r.nombre }),
    ...(r.descripcion !== undefined && { descripcion: r.descripcion }),
  };
}

export async function getRoles(all = false): Promise<Role[]> {
  const res = await api.get(`/roles?all=${all ? 1 : 0}`);
  return Array.isArray(res.data) ? res.data.map(mapRoleFromApi) : [];
}

export async function createRole(role: Omit<Role, 'id' | 'activo' | 'createdAt'>): Promise<Role> {
  const res = await api.post('/roles', mapRoleToApi(role));
  return mapRoleFromApi(res.data);
}

export async function updateRole(id: string, role: Partial<Role>): Promise<Role> {
  const res = await api.patch(`/roles/${id}`, mapRoleToApi(role));
  return mapRoleFromApi(res.data);
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

export async function restoreRole(id: string): Promise<Role> {
  const res = await api.patch(`/roles/${id}/restore`);
  return mapRoleFromApi(res.data);
}

