import type {
  ResponsablePayload,
  ResponsablesPayload,
  ResponsabilidadRole,
} from "@/types/documents";

const DEFAULT_RESPONSABILIDAD_IDS: Record<ResponsabilidadRole, number> = {
  REVISA: 1,
  APRUEBA: 2,
  ENTERADO: 3,
  ELABORA: 4,
};

const RESPONSABILIDAD_ID_MAP: Record<ResponsabilidadRole, Set<number>> = {
  REVISA: new Set([DEFAULT_RESPONSABILIDAD_IDS.REVISA]),
  APRUEBA: new Set([DEFAULT_RESPONSABILIDAD_IDS.APRUEBA]),
  ENTERADO: new Set([DEFAULT_RESPONSABILIDAD_IDS.ENTERADO]),
  ELABORA: new Set([DEFAULT_RESPONSABILIDAD_IDS.ELABORA]),
};

const RESPONSABILIDAD_ROLE_NAMES: Record<ResponsabilidadRole, string[]> = {
  REVISA: ["REVISA", "REV", "REVISION"],
  APRUEBA: ["APRUEBA", "APR", "APROB"],
  ENTERADO: ["ENTERADO", "ENT"],
  ELABORA: ["ELABORA", "ELAB"],
};

const RESPONSABILIDAD_ROLES: ResponsabilidadRole[] = [
  "ELABORA",
  "REVISA",
  "APRUEBA",
  "ENTERADO",
];

const firstNonEmptyString = (values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
};

const sanitizeText = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractUserId = (user: any): number | null =>
  toNumber(
    user?.id ??
      user?.userId ??
      user?.usuarioId ??
      user?.idUsuario ??
      user?.usuario_id ??
      user?.user_id ??
      user?.uid ??
      user?.value,
  );

const extractFullName = (user: any): string | null => {
  const parts = [
    firstNonEmptyString([user?.primer_nombre, user?.primerNombre, user?.first_name, user?.firstName]),
    firstNonEmptyString([user?.segundo_name, user?.segundoNombre, user?.middle_name, user?.middleName]),
    firstNonEmptyString([user?.tercer_nombre, user?.tercerNombre]),
    firstNonEmptyString([user?.primer_apellido, user?.primerApellido, user?.last_name, user?.lastName]),
    firstNonEmptyString([user?.segundo_apellido, user?.segundoApellido, user?.second_last_name, user?.secondLastName]),
    firstNonEmptyString([user?.apellido_casada, user?.apellidoCasada, user?.married_name, user?.marriedName]),
  ].filter(Boolean) as string[];

  if (parts.length) {
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  const direct = firstNonEmptyString([user?.nombre, user?.name, user?.displayName]);
  return direct;
};

const extractPosition = (user: any): string | null =>
  firstNonEmptyString([
    user?.posicionNombre,
    user?.posicion?.nombre,
    user?.puesto,
    user?.position,
    user?.cargo,
    user?.roleName,
  ]);

const extractGerencia = (user: any): string | null =>
  firstNonEmptyString([
    user?.gerenciaNombre,
    user?.gerencia?.nombre,
    user?.gerencia,
    user?.department,
    user?.departamento,
    user?.area,
  ]);

const registerResponsabilidadId = (role: ResponsabilidadRole, responsabilidadId: number) => {
  if (!Number.isFinite(responsabilidadId)) return;
  RESPONSABILIDAD_ID_MAP[role].add(responsabilidadId);
};

const normalizeResponsabilidadName = (value?: string | null): ResponsabilidadRole | null => {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!raw) return null;
  for (const role of RESPONSABILIDAD_ROLES) {
    if (RESPONSABILIDAD_ROLE_NAMES[role].some((candidate) => raw.includes(candidate))) {
      return role;
    }
  }
  return null;
};

const resolveRoleFromId = (
  responsabilidadId: number,
  fallbackName?: string | null,
): ResponsabilidadRole | null => {
  for (const role of RESPONSABILIDAD_ROLES) {
    if (RESPONSABILIDAD_ID_MAP[role].has(responsabilidadId)) {
      return role;
    }
  }

  const normalized = normalizeResponsabilidadName(fallbackName);
  if (normalized) {
    registerResponsabilidadId(normalized, responsabilidadId);
    return normalized;
  }

  return null;
};

const ensureResponsabilidadId = (value: unknown): number | null => {
  const parsed = toNumber(value);
  return parsed != null ? parsed : null;
};

const ensureNombre = (user: any, fallback?: string | null, userId?: number | null): string => {
  const nombre = sanitizeText(extractFullName(user)) ?? sanitizeText(fallback);
  if (nombre) return nombre;
  if (Number.isFinite(userId)) return `Usuario ${userId}`;
  return "Usuario";
};

const toResponsablePayload = (
  user: any,
  responsabilidadId: number,
  fallbackNombre?: string | null,
): ResponsablePayload => {
  const userId = extractUserId(user);
  if (userId == null) {
    throw new Error("El usuario seleccionado no tiene un identificador válido");
  }

  const nombre = ensureNombre(user, fallbackNombre, userId);
  const puesto = sanitizeText(extractPosition(user));
  const gerencia = sanitizeText(extractGerencia(user));

  return {
    userId,
    nombre,
    puesto,
    gerencia,
    responsabilidadId,
  } satisfies ResponsablePayload;
};

export interface ResponsableSelection {
  user: any;
  responsabilidadId: number | string;
  role?: ResponsabilidadRole | null;
  responsabilidadNombre?: string | null;
  fallbackNombre?: string | null;
}

export interface BuildResponsablesPayloadInput {
  seleccionados: ResponsableSelection[];
  elaboraUserId?: number | null;
}

export const getResponsabilidadIdForRole = (role: ResponsabilidadRole): number => {
  const ids = RESPONSABILIDAD_ID_MAP[role];
  const first = ids.values().next().value as number | undefined;
  if (typeof first === "number" && Number.isFinite(first)) return first;
  return DEFAULT_RESPONSABILIDAD_IDS[role];
};

export const buildResponsablesPayload = ({
  seleccionados,
  elaboraUserId,
}: BuildResponsablesPayloadInput): ResponsablesPayload => {
  const payload: ResponsablesPayload = {
    elabora: null,
    revisa: [],
    aprueba: [],
    enterado: [],
  };

  seleccionados.forEach((selection) => {
    const responsabilidadId = ensureResponsabilidadId(selection.responsabilidadId);
    if (responsabilidadId == null) {
      throw new Error("Falta el identificador de responsabilidad para uno de los firmantes");
    }

    const userId = extractUserId(selection.user);
    const roleFromSelection = selection.role ?? normalizeResponsabilidadName(selection.responsabilidadNombre);
    const resolvedRole =
      roleFromSelection ??
      (userId != null && elaboraUserId != null && userId === elaboraUserId ? "ELABORA" : null) ??
      resolveRoleFromId(responsabilidadId, selection.responsabilidadNombre);

    if (!resolvedRole) {
      throw new Error("No se pudo determinar la responsabilidad de uno de los firmantes");
    }

    registerResponsabilidadId(resolvedRole, responsabilidadId);
    const responsable = toResponsablePayload(selection.user, responsabilidadId, selection.fallbackNombre);

    switch (resolvedRole) {
      case "ELABORA":
        payload.elabora = responsable;
        break;
      case "REVISA":
        payload.revisa.push(responsable);
        break;
      case "APRUEBA":
        payload.aprueba.push(responsable);
        break;
      case "ENTERADO":
        payload.enterado.push(responsable);
        break;
      default:
        break;
    }
  });

  return payload;
};

export const collectAllResponsables = (payload: ResponsablesPayload): ResponsablePayload[] => {
  const list: ResponsablePayload[] = [];
  if (payload.elabora) list.push(payload.elabora);
  list.push(...payload.revisa, ...payload.aprueba, ...payload.enterado);
  return list;
};

export type { ResponsabilidadRole };
