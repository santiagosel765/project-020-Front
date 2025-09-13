export interface Role {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  createdAt?: string;
}

export * from "./rolesService";
