import api from './axiosConfig';

// =======================
// Tipos de usuario
// =======================
export interface CatalogoItem {
  id: number;
  nombre: string;
  activo?: boolean | null;
}

export interface UiUser {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  apellidoCasada?: string;
  codigoEmpleado: string;
  posicionId?: number | null;
  posicionNombre?: string | null;
  gerenciaId?: number | null;
  gerenciaNombre?: string | null;
  correoInstitucional: string;
  telefono: string;
  activo?: boolean;
  fotoPerfil?: string;
  urlFoto?: string | null;
  roles?: Array<{ id: number; nombre: string }>;
  /** Campos agregados para componentes de UI */
  name: string;
  position: string;
  department: string;
  avatar?: string;
  employeeCode?: string;
}

export type User = UiUser;

export interface DocumentUser extends UiUser {
  responsibility?: 'REVISA' | 'APRUEBA' | 'ENTERADO';
  statusChangeDate?: string;
  status?: 'FIRMADO' | 'RECHAZADO' | 'PENDIENTE';
  rejectionReason?: string;
}

// =======================
// Tipos de documentos
// =======================
export interface Document {
  id: string;
  code: string;
  name: string;
  description: string;
  sendDate: string;
  lastStatusChangeDate: string;
  businessDays: number;
  status: 'Completado' | 'Rechazado' | 'Pendiente' | 'En Progreso';
  assignedUsers?: DocumentUser[];
  filePath?: string;
}

// =======================
// Helpers de mapeo
// =======================
function mapUserFromApi(u: any): UiUser {
  const posicionId =
    u?.posicion_id ??
    u?.posicionId ??
    (typeof u?.posicion?.id === 'number' ? u.posicion.id : undefined);
  const gerenciaId =
    u?.gerencia_id ??
    u?.gerenciaId ??
    (typeof u?.gerencia?.id === 'number' ? u.gerencia.id : undefined);
  const posicionNombre =
    u?.posicionNombre ??
    u?.posicion_nombre ??
    (typeof u?.posicion?.nombre === 'string' ? u.posicion.nombre : undefined);
  const gerenciaNombre =
    u?.gerenciaNombre ??
    u?.gerencia_nombre ??
    (typeof u?.gerencia?.nombre === 'string' ? u.gerencia.nombre : undefined);
  const foto = u?.url_foto ?? u?.urlFoto ?? u?.foto_perfil ?? null;

  const roles = Array.isArray(u?.roles)
    ? u.roles
        .map((r: any) => ({
          id: typeof r?.id === 'number' ? r.id : Number(r?.id),
          nombre:
            typeof r?.nombre === 'string'
              ? r.nombre
              : typeof r?.name === 'string'
              ? r.name
              : '',
        }))
        .filter((r) => Number.isFinite(r.id) && r.nombre.trim() !== '')
    : [];

  const user: UiUser = {
    id: String(u?.id ?? ''),
    primerNombre: u?.primer_nombre ?? u?.primerNombre ?? '',
    segundoNombre: u?.segundo_nombre ?? u?.segundoNombre ?? '',
    tercerNombre: u?.tercer_nombre ?? u?.tercerNombre ?? '',
    primerApellido: u?.primer_apellido ?? u?.primerApellido ?? '',
    segundoApellido: u?.segundo_apellido ?? u?.segundoApellido ?? '',
    apellidoCasada: u?.apellido_casada ?? u?.apellidoCasada ?? '',
    codigoEmpleado: u?.codigo_empleado ?? u?.codigoEmpleado ?? '',
    posicionId: posicionId != null ? Number(posicionId) : null,
    posicionNombre: posicionNombre ?? null,
    gerenciaId: gerenciaId != null ? Number(gerenciaId) : null,
    gerenciaNombre: gerenciaNombre ?? null,
    correoInstitucional: u?.correo_institucional ?? u?.correoInstitucional ?? '',
    telefono: u?.telefono ?? '',
    activo: u?.activo ?? true,
    fotoPerfil: foto ?? undefined,
    urlFoto: foto,
    roles,
    name: '',
    position: '',
    department: '',
    avatar: foto ?? undefined,
    employeeCode: u?.codigo_empleado ?? u?.codigoEmpleado ?? undefined,
  };

  user.name = [
    user.primerNombre,
    user.segundoNombre,
    user.tercerNombre,
    user.primerApellido,
    user.segundoApellido,
    user.apellidoCasada,
  ]
    .filter(Boolean)
    .join(' ');
  user.position = user.posicionNombre ?? (user.posicionId != null ? String(user.posicionId) : '');
  user.department = user.gerenciaNombre ?? (user.gerenciaId != null ? String(user.gerenciaId) : '');
  user.avatar = user.urlFoto ?? user.fotoPerfil ?? undefined;
  user.employeeCode = user.codigoEmpleado;

  return user;
}

function mapUserToApi(u: Partial<User>): Record<string, any> {
  return {
    ...(u.primerNombre !== undefined && { primer_nombre: u.primerNombre }),
    ...(u.segundoNombre !== undefined && { segundo_nombre: u.segundoNombre }),
    ...(u.tercerNombre !== undefined && { tercer_nombre: u.tercerNombre }),
    ...(u.primerApellido !== undefined && { primer_apellido: u.primerApellido }),
    ...(u.segundoApellido !== undefined && { segundo_apellido: u.segundoApellido }),
    ...(u.apellidoCasada !== undefined && { apellido_casada: u.apellidoCasada }),
    ...(u.codigoEmpleado !== undefined && { codigo_empleado: u.codigoEmpleado }),
    ...(u.posicionId !== undefined && { posicion_id: u.posicionId }),
    ...(u.gerenciaId !== undefined && { gerencia_id: u.gerenciaId }),
    ...(u.correoInstitucional !== undefined && { correo_institucional: u.correoInstitucional }),
    ...(u.telefono !== undefined && { telefono: u.telefono }),
  };
}

function mapDocumentFromApi(d: any): Document {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description,
    sendDate: d.send_date,
    lastStatusChangeDate: d.last_status_change_date,
    businessDays: d.business_days,
    status: d.status,
    filePath: d.file_path,
    assignedUsers: Array.isArray(d.assigned_users)
      ? d.assigned_users.map((u: any) => ({
          ...mapUserFromApi(u),
          responsibility: u.responsibility,
          statusChangeDate: u.status_change_date,
          status: u.status,
          rejectionReason: u.rejection_reason,
        }))
      : [],
  };
}

function mapDocumentToApi(doc: Omit<Document, 'id'> | Document): Record<string, any> {
  return {
    code: doc.code,
    name: doc.name,
    description: doc.description,
    send_date: doc.sendDate,
    last_status_change_date: doc.lastStatusChangeDate,
    business_days: doc.businessDays,
    status: doc.status,
    file_path: doc.filePath,
    assigned_users: doc.assignedUsers?.map((u) => ({
      ...mapUserToApi(u),
      responsibility: u.responsibility,
      status_change_date: u.statusChangeDate,
      status: u.status,
      rejection_reason: u.rejectionReason,
    })),
  };
}

// =======================
// Usuarios
// =======================
export async function getUsers(): Promise<User[]> {
  const { data } = await api.get('/users');
  return data.map(mapUserFromApi);
}

export async function createUser(user: User): Promise<User> {
  const { data } = await api.post('/users', mapUserToApi(user));
  return mapUserFromApi(data);
}

export async function updateUser(user: User): Promise<User> {
  if (!user.id) throw new Error('ID del usuario es requerido');
  const { data } = await api.put(`/users/${user.id}`, mapUserToApi(user));
  return mapUserFromApi(data);
}

export async function patchUser(id: string, update: Partial<User>): Promise<User> {
  const { data } = await api.patch(`/users/${id}`, mapUserToApi(update));
  return mapUserFromApi(data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

// =======================
// Documentos
// =======================
export async function getDocuments(): Promise<Document[]> {
  const { data } = await api.get('/documents');
  return data.map(mapDocumentFromApi);
}

export async function createDocument(doc: Omit<Document, 'id'>): Promise<Document> {
  const { data } = await api.post('/documents', mapDocumentToApi(doc));
  return mapDocumentFromApi(data);
}

export async function updateDocument(doc: Document): Promise<Document> {
  const { data } = await api.put(`/documents/${doc.id}`, mapDocumentToApi(doc));
  return mapDocumentFromApi(data);
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

