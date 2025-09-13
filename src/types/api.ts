export namespace Api {
  // Core entities
  export interface User {
    id: number;
    nombre: string;
    correo: string;
    roles: string[];
    pages: Pagina[];
  }

  export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
    deletedAt?: string | null;
  }

  export interface Pagina {
    id: number;
    nombre: string;
    url: string;
    descripcion?: string;
  }

  export interface CuadroFirma {
    id: number;
    titulo: string;
    descripcion?: string;
    version?: string;
    codigo?: string;
    empresa_id: number;
    createdBy: number;
  }

  export interface EstadoFirma {
    id: number;
    nombre: string;
  }

  // DTOs
  export interface CreateUserDto {
    nombre: string;
    correo: string;
    password: string;
    roleIds?: number[];
  }

  export interface LoginDto {
    email: string;
    password: string;
  }

  export interface CreateRolDto {
    nombre: string;
    descripcion?: string;
  }

  export interface CreatePaginaDto {
    nombre: string;
    url: string;
    descripcion?: string;
  }

  export interface CreatePlantillaDto {
    titulo: string;
    descripcion?: string;
    contenido?: string;
  }

  export interface CreateCuadroFirmaDto {
    titulo: string;
    descripcion?: string;
    version?: string;
    codigo?: string;
    empresa_id: number;
    createdBy: number;
  }

  export interface ResponsablesFirmaDto {
    [key: string]: any;
  }

  export interface AddHistorialCuadroFirmaDto {
    cuadroFirmaId: number;
    userId: number;
    accion: string;
    observaciones?: string;
  }

  export interface FirmaCuadroDto {
    userId: number;
    nombreUsuario: string;
    cuadroFirmaId: number;
    responsabilidadId: number;
    nombreResponsabilidad: string;
  }

  export interface UpdateEstadoAsignacionDto {
    asignacionId: number;
    estado: string;
    observaciones?: string;
  }
}

