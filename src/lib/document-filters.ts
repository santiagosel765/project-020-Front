import { Document, DocumentSignatureEntry } from "@/lib/data";

export type StatusFilter = "ALL" | "EN_PROGRESO" | "COMPLETADO" | "RECHAZADO";
export type MySignFilter = "ALL" | "SIGNED" | "UNSIGNED";

export interface StatusFilterOption {
  value: StatusFilter;
  label: string;
}

export interface MySignFilterOption {
  value: MySignFilter;
  label: string;
}

export const STATUS_FILTER_OPTIONS: ReadonlyArray<StatusFilterOption> = [
  { value: "ALL", label: "Todos" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "RECHAZADO", label: "Rechazado" },
] as const;

export const MY_SIGN_FILTER_OPTIONS: ReadonlyArray<MySignFilterOption> = [
  { value: "ALL", label: "Todos" },
  { value: "SIGNED", label: "Firmados" },
  { value: "UNSIGNED", label: "No firmados" },
] as const;

export type StatusCounts = Record<"ALL" | "EN_PROGRESO" | "COMPLETADO" | "RECHAZADO", number>;

export const INITIAL_STATUS_COUNTS: StatusCounts = {
  ALL: 0,
  EN_PROGRESO: 0,
  COMPLETADO: 0,
  RECHAZADO: 0,
};

const STATUS_QUERY_MAP: Record<StatusFilter, string> = {
  ALL: "all",
  EN_PROGRESO: "en-progreso",
  COMPLETADO: "completado",
  RECHAZADO: "rechazado",
};

const MY_SIGN_QUERY_MAP: Record<MySignFilter, string> = {
  ALL: "all",
  SIGNED: "signed",
  UNSIGNED: "unsigned",
};

const STATUS_NAME_LOOKUP: Record<Exclude<StatusFilter, "ALL">, Document["status"]> = {
  EN_PROGRESO: "En Progreso",
  COMPLETADO: "Completado",
  RECHAZADO: "Rechazado",
};

export const getStatusFilterLabel = (value: StatusFilter): string => {
  return STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? "";
};

export const getMySignFilterLabel = (value: MySignFilter): string => {
  return MY_SIGN_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? "";
};

export const statusFilterToStatusName = (
  filter: StatusFilter,
): Document["status"] | null => {
  if (filter === "ALL") return null;
  return STATUS_NAME_LOOKUP[filter];
};

export const statusFilterToQuery = (filter: StatusFilter): string => {
  return STATUS_QUERY_MAP[filter] ?? STATUS_QUERY_MAP.ALL;
};

export const statusFilterFromQuery = (
  value: string | null | undefined,
): StatusFilter => {
  if (!value) return "ALL";
  const normalized = value.trim().toLowerCase();
  const entry = Object.entries(STATUS_QUERY_MAP).find(([, query]) => query === normalized);
  return (entry?.[0] as StatusFilter | undefined) ?? "ALL";
};

export const mySignFilterToQuery = (filter: MySignFilter): string => {
  return MY_SIGN_QUERY_MAP[filter] ?? MY_SIGN_QUERY_MAP.ALL;
};

export const mySignFilterFromQuery = (value: string | null | undefined): MySignFilter => {
  if (!value) return "ALL";
  const normalized = value.trim().toLowerCase();
  const entry = Object.entries(MY_SIGN_QUERY_MAP).find(([, query]) => query === normalized);
  return (entry?.[0] as MySignFilter | undefined) ?? "ALL";
};

const toSignatureEntries = (
  item: { signatureEntries?: DocumentSignatureEntry[]; [key: string]: any },
): DocumentSignatureEntry[] => {
  if (Array.isArray(item?.signatureEntries)) {
    return item.signatureEntries as DocumentSignatureEntry[];
  }
  const fromCuadro = item?.cuadro_firma?.cuadro_firma_user;
  if (Array.isArray(fromCuadro)) {
    return fromCuadro as DocumentSignatureEntry[];
  }
  return [];
};

const resolveEntryUserId = (entry: DocumentSignatureEntry): number | null => {
  const rawId =
    entry?.user_id ??
    entry?.userId ??
    (entry?.user && (entry.user.id ?? entry.user.user_id ?? entry.user.userId));
  const numeric = Number(rawId);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
};

export const getMySignInfo = (
  item: { signatureEntries?: DocumentSignatureEntry[]; [key: string]: any },
  currentUserId?: number,
): { assigned: boolean; signed: boolean; unsigned: boolean } => {
  if (!Number.isFinite(currentUserId)) {
    return { assigned: false, signed: false, unsigned: false };
  }

  const entries = toSignatureEntries(item);
  if (!entries.length) {
    return { assigned: false, signed: false, unsigned: false };
  }

  const normalizedUserId = Number(currentUserId);
  const mine = entries.filter((entry) => resolveEntryUserId(entry) === normalizedUserId);
  const assigned = mine.length > 0;
  const signed = mine.some((entry) => entry?.estaFirmado === true);
  const unsigned = assigned && mine.every((entry) => entry?.estaFirmado !== true);
  return { assigned, signed, unsigned };
};
