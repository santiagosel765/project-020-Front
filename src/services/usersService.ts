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
  url_foto?: string | null;
  urlFoto?: string | null;
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
  urlFoto: u.url_foto ?? u.urlFoto ?? null,
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
  avatar: u.url_foto ?? u.urlFoto ?? '',
});

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get('/users');
  return unwrapArray<ApiUser>(data)
    .filter((u) => u.activo !== false)
    .map(toUiUser);
}

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } } as const;

const userFieldMap: Partial<Record<keyof User, string>> = {
  primerNombre: 'primer_nombre',
  segundoNombre: 'segundo_nombre',
  tercerNombre: 'tercer_nombre',
  primerApellido: 'primer_apellido',
  segundoApellido: 'segundo_apellido',
  apellidoCasada: 'apellido_casada',
  codigoEmpleado: 'codigo_empleado',
  posicionId: 'posicion_id',
  gerenciaId: 'gerencia_id',
  correoInstitucional: 'correo_institucional',
  telefono: 'telefono',
};

export type UserFormPayload = Pick<
  User,
  | 'primerNombre'
  | 'segundoNombre'
  | 'tercerNombre'
  | 'primerApellido'
  | 'segundoApellido'
  | 'apellidoCasada'
  | 'codigoEmpleado'
  | 'posicionId'
  | 'gerenciaId'
  | 'correoInstitucional'
  | 'telefono'
> & { urlFoto?: string | null };

export function buildUserFormData(values: Partial<UserFormPayload>, file?: Blob | null) {
  const fd = new FormData();
  Object.entries(userFieldMap).forEach(([key, snake]) => {
    const formKey = key as keyof UserFormPayload;
    const value = values[formKey];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      fd.append(snake!, String(value));
    }
  });
  if (file) {
    fd.append('foto', file);
  }
  return fd;
}

export async function createUser(body: FormData): Promise<User> {
  const { data } = await api.post('/users', body, multipartConfig);
  return toUiUser(unwrapOne<ApiUser>(data));
}

export async function updateUser(id: number, body: FormData): Promise<User> {
  const { data } = await api.patch(`/users/${id}`, body, multipartConfig);
  return toUiUser(unwrapOne<ApiUser>(data));
}

export async function deleteUser(id: number): Promise<{ id: string }> {
  const { data } = await api.delete(`/users/${id}`);
  const deleted = unwrapOne<ApiUser>(data);
  return { id: String((deleted as any)?.id ?? id) };
}

export async function changeUserPassword(
  id: number,
  payload: { currentPassword?: string; newPassword: string },
) {
  await api.patch(`/users/${id}/password`, payload);
}

export async function getMe(): Promise<any> {
  const { data } = await api.get('/users/me');
  const normalized = normalizeOne<any>(data);
  if (!normalized) return normalized;
  const urlFoto = normalized.urlFoto ?? normalized.url_foto ?? normalized.foto_perfil ?? null;
  return { ...normalized, urlFoto };
}

export async function updateMyAvatar(file: Blob) {
  const fd = new FormData();
  fd.append('foto', file);
  const { data } = await api.patch('/users/me', fd, multipartConfig);
  return normalizeOne<any>(data);
}
