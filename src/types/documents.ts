export type ResponsabilidadRole = "ELABORA" | "REVISA" | "APRUEBA" | "ENTERADO";

export type ResponsablePayload = {
  userId: number;
  nombre: string;
  puesto: string | null;
  gerencia: string | null;
  responsabilidadId: number;
};

export type ResponsablesPayload = {
  elabora: ResponsablePayload | null;
  revisa: ResponsablePayload[];
  aprueba: ResponsablePayload[];
  enterado: ResponsablePayload[];
};

export type CuadroFirmaUpdatePayload = {
  titulo?: string;
  descripcion?: string;
  version?: string | number;
  codigo?: string;
  empresaId?: number | null;
  responsables: ResponsablesPayload;
  observaciones?: string;
  idUser?: number | string | null;
};
