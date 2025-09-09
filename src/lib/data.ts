import api from './axiosConfig';

// =======================
// Tipos de usuario
// =======================
export interface User {
  id?: string;
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  apellidoCasada?: string;
  codigoEmpleado: string;
  posicionId: string;
  gerenciaId: string;
  correoInstitucional: string;
  telefono: string;
  fotoPerfil?: string;
  /** Campos agregados para componentes de UI */
  name: string;
  position: string;
  department: string;
  avatar?: string;
  employeeCode?: string;
}

export interface DocumentUser extends User {
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
  assignedUsers: DocumentUser[];
  filePath?: string;
}

// =======================
// Helpers de mapeo
// =======================
function mapUserFromApi(u: any): User {
  const user: User = {
    id: u.id,
    primerNombre: u.primer_nombre,
    segundoNombre: u.segundo_nombre,
    tercerNombre: u.tercer_nombre,
    primerApellido: u.primer_apellido,
    segundoApellido: u.segundo_apellido,
    apellidoCasada: u.apellido_casada,
    codigoEmpleado: u.codigo_empleado,
    posicionId: u.posicion_id,
    gerenciaId: u.gerencia_id,
    correoInstitucional: u.correo_institucional,
    telefono: u.telefono,
    fotoPerfil: u.foto_perfil,
    name: '',
    position: '',
    department: '',
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
  user.position = user.posicionId;
  user.department = user.gerenciaId;
  user.avatar = user.fotoPerfil;
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
    ...(u.fotoPerfil !== undefined && { foto_perfil: u.fotoPerfil }),
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

