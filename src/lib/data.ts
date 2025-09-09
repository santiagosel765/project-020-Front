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
}

// =======================
// Tipos de documentos
// =======================
export interface DocumentUser extends User {
  statusChangeDate?: string;
}

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
// URL de la API
// =======================
const USERS_API = "http://localhost:3200/api/v1/users";
const DOCUMENTS_API = "http://localhost:3200/api/v1/documents";

// =======================
// Usuarios
// =======================
export async function getUsers(): Promise<User[]> {
  const res = await fetch(USERS_API);
  if (!res.ok) throw new Error("Error al obtener usuarios");
  const data = await res.json();
  return data.map((u: any) => ({
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
  }));
}

export async function createUser(user: User): Promise<User> {
  const payload = {
    primer_nombre: user.primerNombre,
    segundo_nombre: user.segundoNombre,
    tercer_nombre: user.tercerNombre,
    primer_apellido: user.primerApellido,
    segundo_apellido: user.segundoApellido,
    apellido_casada: user.apellidoCasada,
    codigo_empleado: user.codigoEmpleado,
    posicion_id: user.posicionId,
    gerencia_id: user.gerenciaId,
    correo_institucional: user.correoInstitucional,
    telefono: user.telefono,
    foto_perfil: user.fotoPerfil || null,
  };
  const res = await fetch(USERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al crear usuario");
  const savedUser = await res.json();
  return {
    id: savedUser.id,
    primerNombre: savedUser.primer_nombre,
    segundoNombre: savedUser.segundo_nombre,
    tercerNombre: savedUser.tercer_nombre,
    primerApellido: savedUser.primer_apellido,
    segundoApellido: savedUser.segundo_apellido,
    apellidoCasada: savedUser.apellido_casada,
    codigoEmpleado: savedUser.codigo_empleado,
    posicionId: savedUser.posicion_id,
    gerenciaId: savedUser.gerencia_id,
    correoInstitucional: savedUser.correo_institucional,
    telefono: savedUser.telefono,
    fotoPerfil: savedUser.foto_perfil,
  };
}

export async function updateUser(user: User): Promise<User> {
  if (!user.id) throw new Error("ID del usuario es requerido para actualizar");
  const payload = {
    primer_nombre: user.primerNombre,
    segundo_nombre: user.segundoNombre,
    tercer_nombre: user.tercerNombre,
    primer_apellido: user.primerApellido,
    segundo_apellido: user.segundoApellido,
    apellido_casada: user.apellidoCasada,
    codigo_empleado: user.codigoEmpleado,
    posicion_id: user.posicionId,
    gerencia_id: user.gerenciaId,
    correo_institucional: user.correoInstitucional,
    telefono: user.telefono,
    foto_perfil: user.fotoPerfil || null,
  };
  const res = await fetch(`${USERS_API}/${user.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al actualizar usuario");
  const updatedUser = await res.json();
  return {
    id: updatedUser.id,
    primerNombre: updatedUser.primer_nombre,
    segundoNombre: updatedUser.segundo_nombre,
    tercerNombre: updatedUser.tercer_nombre,
    primerApellido: updatedUser.primer_apellido,
    segundoApellido: updatedUser.segundo_apellido,
    apellidoCasada: updatedUser.apellido_casada,
    codigoEmpleado: updatedUser.codigo_empleado,
    posicionId: updatedUser.posicion_id,
    gerenciaId: updatedUser.gerencia_id,
    correoInstitucional: updatedUser.correo_institucional,
    telefono: updatedUser.telefono,
    fotoPerfil: updatedUser.foto_perfil,
  };
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${USERS_API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar usuario");
}

// =======================
// Documentos
// =======================
export async function getDocuments(): Promise<Document[]> {
  const res = await fetch(DOCUMENTS_API);
  if (!res.ok) throw new Error("Error al obtener documentos");
  return res.json();
}

export async function createDocument(doc: Omit<Document, 'id'>): Promise<Document> {
  const res = await fetch(DOCUMENTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error("Error al crear documento");
  return res.json();
}

export async function updateDocument(doc: Document): Promise<Document> {
  const res = await fetch(`${DOCUMENTS_API}/${doc.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error("Error al actualizar documento");
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${DOCUMENTS_API}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar documento");
}
