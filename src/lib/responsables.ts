const RESPONSABILIDAD_ID = {
  REVISA: 1,
  APRUEBA: 2,
  ENTERADO: 3,
  ELABORA: 4,
} as const;

type Role = keyof typeof RESPONSABILIDAD_ID;

const firstNonEmptyString = (values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractId = (user: any): number | null =>
  toNumber(
    user?.id ??
      user?.userId ??
      user?.usuarioId ??
      user?.user_id ??
      user?.usuario_id ??
      user?.uid ??
      user?.value,
  );

const fullName = (user: any): string => {
  const parts = [
    firstNonEmptyString([user?.primer_nombre, user?.primerNombre, user?.first_name, user?.firstName]),
    firstNonEmptyString([user?.segundo_name, user?.segundoNombre, user?.middle_name, user?.middleName]),
    firstNonEmptyString([user?.tercer_nombre, user?.tercerNombre]),
    firstNonEmptyString([user?.primer_apellido, user?.primerApellido, user?.last_name, user?.lastName]),
    firstNonEmptyString([user?.segundo_apellido, user?.segundoApellido, user?.second_last_name, user?.secondLastName]),
    firstNonEmptyString([user?.apellido_casada, user?.apellidoCasada, user?.married_name, user?.marriedName]),
  ].filter(Boolean);

  if (parts.length) {
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  if (typeof user?.nombre === "string") return user.nombre.trim();
  if (typeof user?.name === "string") return user.name.trim();

  return "";
};

const extractPosition = (user: any): string =>
  firstNonEmptyString([
    user?.posicionNombre,
    user?.posicion?.nombre,
    user?.puesto,
    user?.position,
    user?.cargo,
  ]);

const extractGerencia = (user: any): string =>
  firstNonEmptyString([
    user?.gerenciaNombre,
    user?.gerencia?.nombre,
    user?.gerencia,
    user?.department,
    user?.departamento,
  ]);

export type ResponsableDTO = {
  userId: number;
  nombre: string;
  puesto: string;
  gerencia: string;
  responsabilidadId: (typeof RESPONSABILIDAD_ID)[Role];
};

export function toResponsibleDTO(user: any, rol: Role): ResponsableDTO {
  const userId = extractId(user);

  if (userId == null) {
    throw new Error("El usuario seleccionado no tiene un identificador válido");
  }

  return {
    userId,
    nombre: fullName(user),
    puesto: extractPosition(user),
    gerencia: extractGerencia(user),
    responsabilidadId: RESPONSABILIDAD_ID[rol],
  };
}

export interface BuildResponsablesInput {
  elaboraUser?: any | null;
  revisaUsers?: any[] | null;
  apruebaUsers?: any[] | null;
  enteradoUsers?: any[] | null;
}

export type BuildResponsablesOutput = {
  elabora?: ResponsableDTO;
  revisa: ResponsableDTO[];
  aprueba: ResponsableDTO[];
  enterado: ResponsableDTO[];
};

export const buildResponsables = ({
  elaboraUser,
  revisaUsers,
  apruebaUsers,
  enteradoUsers,
}: BuildResponsablesInput): BuildResponsablesOutput => {
  const payload: BuildResponsablesOutput = {
    elabora: elaboraUser ? toResponsibleDTO(elaboraUser, "ELABORA") : undefined,
    revisa: Array.isArray(revisaUsers) ? revisaUsers.map((user) => toResponsibleDTO(user, "REVISA")) : [],
    aprueba: Array.isArray(apruebaUsers) ? apruebaUsers.map((user) => toResponsibleDTO(user, "APRUEBA")) : [],
    enterado: Array.isArray(enteradoUsers) ? enteradoUsers.map((user) => toResponsibleDTO(user, "ENTERADO")) : [],
  };

  return payload;
};

