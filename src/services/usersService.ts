import { api } from '@/lib/api';
import type { CatalogoItem, UiUser } from '@/lib/data';
import { unwrapArray, unwrapOne, normalizeOne, normalizeList } from '@/lib/apiEnvelope';

type ApiCatalogItem = {
  id: number;
  nombre: string;
  activo?: boolean | null;
};

type ApiRole = {
  id: number | string;
  nombre?: string | null;
  name?: string | null;
};

type ApiUser = {
  id: number;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  segundo_name?: string | null;
  tercer_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  apellido_casada?: string | null;
  correo_institucional?: string | null;
  codigo_empleado?: string | null;
  posicion_id?: number | null;
  posicion?: ApiCatalogItem | null;
  posicion_nombre?: string | null;
  posicionNombre?: string | null;
  gerencia_id?: number | null;
  gerencia?: ApiCatalogItem | null;
  gerencia_nombre?: string | null;
  gerenciaNombre?: string | null;
  telefono?: string | null;
  activo?: boolean | null;
  url_foto?: string | null;
  urlFoto?: string | null;
  foto_perfil?: string | null;
  roles?: ApiRole[] | null;
};

const toUiUser = (u: ApiUser): UiUser => {
  const posicionId =
    u.posicion_id ??
    (u.posicion && typeof u.posicion.id === 'number' ? u.posicion.id : undefined);
  const gerenciaId =
    u.gerencia_id ??
    (u.gerencia && typeof u.gerencia.id === 'number' ? u.gerencia.id : undefined);
  const foto = u.url_foto ?? u.urlFoto ?? u.foto_perfil ?? null;
  const roles = Array.isArray(u.roles)
    ? u.roles
        .map((role) => ({
          id: typeof role.id === 'number' ? role.id : Number(role.id),
          nombre:
            typeof role.nombre === 'string'
              ? role.nombre
              : typeof role.name === 'string'
              ? role.name
              : '',
        }))
        .filter((role) => Number.isFinite(role.id) && role.nombre.trim() !== '')
    : [];

  const primerNombre = u.primer_nombre ?? '';
  const segundoNombre = u.segundo_nombre ?? u.segundo_name ?? '';
  const tercerNombre = u.tercer_nombre ?? '';
  const primerApellido = u.primer_apellido ?? '';
  const segundoApellido = u.segundo_apellido ?? '';
  const apellidoCasada = u.apellido_casada ?? '';

  const name = [
    primerNombre,
    segundoNombre,
    tercerNombre,
    primerApellido,
    segundoApellido,
    apellidoCasada,
  ]
    .filter(Boolean)
    .join(' ');

  const posicionNombre =
    u.posicionNombre ??
    u.posicion_nombre ??
    (u.posicion && typeof u.posicion.nombre === 'string' ? u.posicion.nombre : null) ??
    null;
  const gerenciaNombre =
    u.gerenciaNombre ??
    u.gerencia_nombre ??
    (u.gerencia && typeof u.gerencia.nombre === 'string' ? u.gerencia.nombre : null) ??
    null;

  return {
    id: String(u.id),
    primerNombre,
    segundoNombre,
    tercerNombre,
    primerApellido,
    segundoApellido,
    apellidoCasada,
    correoInstitucional: u.correo_institucional ?? '',
    codigoEmpleado: u.codigo_empleado ?? '',
    posicionId: posicionId != null ? Number(posicionId) : null,
    posicionNombre,
    gerenciaId: gerenciaId != null ? Number(gerenciaId) : null,
    gerenciaNombre,
    telefono: u.telefono ?? '',
    activo: u.activo ?? true,
    fotoPerfil: foto ?? undefined,
    urlFoto: foto,
    roles,
    name,
    position: posicionNombre ?? (posicionId != null ? String(posicionId) : ''),
    department: gerenciaNombre ?? (gerenciaId != null ? String(gerenciaId) : ''),
    avatar: foto ?? undefined,
    employeeCode: u.codigo_empleado ?? undefined,
  } satisfies UiUser;
};

export async function getUsers(): Promise<UiUser[]> {
  const { data } = await api.get('/users');
  return unwrapArray<ApiUser>(data)
    .filter((u) => u.activo !== false)
    .map(toUiUser);
}

const multipartConfig = { headers: { 'Content-Type': 'multipart/form-data' } } as const;

const userFieldMap: Partial<Record<keyof UserFormPayload, string>> = {
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
  urlFoto: 'url_foto',
};

export type UserFormPayload = Pick<
  UiUser,
  | 'id'
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
  | 'urlFoto'
> & {
  roleIds?: number[];
};

export function buildUserFormData(values: Partial<UserFormPayload>, file?: Blob | null) {
  const fd = new FormData();
  Object.entries(userFieldMap).forEach(([key, snake]) => {
    const formKey = key as keyof UserFormPayload;
    const value = values[formKey];
    if (formKey === 'urlFoto') {
      if (value === undefined) return;
      const normalized = value == null ? '' : String(value);
      fd.append(snake!, normalized);
      return;
    }
    if (value !== undefined && value !== null) {
      const asString = String(value);
      if (asString.trim() !== '') {
        fd.append(snake!, asString);
      }
    }
  });
  if (Array.isArray(values.roleIds)) {
    const roleIds = values.roleIds.filter((id): id is number => Number.isFinite(id));
    fd.append('roles', JSON.stringify(roleIds));
  }
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

const toCatalogItem = (item: ApiCatalogItem): CatalogoItem => ({
  id: Number(item.id),
  nombre: typeof item.nombre === 'string' ? item.nombre : String(item.id),
  activo: item.activo ?? null,
});

export async function getPosiciones({ all = 0 }: { all?: number } = {}): Promise<CatalogoItem[]> {
  const { data } = await api.get(`/posiciones?all=${all}`);
  return normalizeList<ApiCatalogItem>(data).map(toCatalogItem);
}

export async function getGerencias({ all = 0 }: { all?: number } = {}): Promise<CatalogoItem[]> {
  const { data } = await api.get(`/gerencias?all=${all}`);
  return normalizeList<ApiCatalogItem>(data).map(toCatalogItem);
}

export async function getRoles({ all = 0 }: { all?: number } = {}): Promise<CatalogoItem[]> {
  const { data } = await api.get(`/roles?all=${all}`);
  return normalizeList<ApiCatalogItem>(data).map(toCatalogItem);
}
