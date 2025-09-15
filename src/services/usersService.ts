import { api } from '@/lib/api';
import type { User } from '@/lib/data';
import { unwrapArray, unwrapOne, normalizeOne } from '@/lib/apiEnvelope';

type ApiUser = {
  id: number;
  primer_nombre: string;
  segundo_name?: string | null;
  tercer_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  apellido_casada?: string | null;
  correo_institucional: string;
  codigo_empleado?: string | null;
  posicion_id?: number | null;
  gerencia_id?: number | null;
  telefono?: string | null;
  activo?: boolean | null;
};

const toUiUser = (u: ApiUser): User => ({
  id: String(u.id),
  primerNombre: u.primer_nombre ?? '',
  segundoNombre: u.segundo_name ?? '',
  tercerNombre: u.tercer_nombre ?? '',
  primerApellido: u.primer_apellido ?? '',
  segundoApellido: u.segundo_apellido ?? '',
  apellidoCasada: u.apellido_casada ?? '',
  correoInstitucional: u.correo_institucional ?? '',
  codigoEmpleado: u.codigo_empleado ?? '',
  posicionId: u.posicion_id != null ? String(u.posicion_id) : '',
  gerenciaId: u.gerencia_id != null ? String(u.gerencia_id) : '',
  telefono: u.telefono ?? '',
  activo: u.activo ?? true,
  name: [
    u.primer_nombre,
    u.segundo_name,
    u.tercer_nombre,
    u.primer_apellido,
    u.segundo_apellido,
    u.apellido_casada,
  ]
    .filter(Boolean)
    .join(' '),
  position: '',
  department: '',
  avatar: '',
});

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get('/users');
  return unwrapArray<ApiUser>(data).map(toUiUser);
}

export async function createUser(body: any): Promise<User> {
  const { data } = await api.post('/users', body);
  return toUiUser(unwrapOne<ApiUser>(data));
}

export async function updateUser(id: number, body: any): Promise<User> {
  const { data } = await api.patch(`/users/${id}`, body);
  return toUiUser(unwrapOne<ApiUser>(data));
}

export async function deleteUser(id: number): Promise<{ id: string }> {
  const { data } = await api.delete(`/users/${id}`);
  const deleted = unwrapOne<ApiUser>(data);
  return { id: String((deleted as any)?.id ?? id) };
}

export async function getMe(): Promise<any> {
  const { data } = await api.get('/users/me');
  return normalizeOne<any>(data);
}
