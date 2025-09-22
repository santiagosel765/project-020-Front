import { format, isValid, parse, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const GT_TZ = 'America/Guatemala';

const dayFormatterGT = new Intl.DateTimeFormat('es-GT', {
  timeZone: GT_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function parseGTDate(
  input: string | number | Date | null | undefined,
): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }
  if (typeof input === 'number') {
    const dateFromNumber = new Date(input);
    return isValid(dateFromNumber) ? dateFromNumber : null;
  }

  const s = String(input).trim();
  if (!s) return null;

  try {
    const iso = parseISO(s);
    if (isValid(iso)) return iso;
  } catch (error) {
    // ignore parseISO range errors
  }

  const withComma = parse(s, 'dd/MM/yyyy, HH:mm:ss', new Date());
  if (isValid(withComma)) return withComma;

  const noComma = parse(s, 'dd/MM/yyyy HH:mm:ss', new Date());
  if (isValid(noComma)) return noComma;

  const onlyDate = parse(s, 'dd/MM/yyyy', new Date());
  if (isValid(onlyDate)) return onlyDate;

  return null;
}

function toDate(input?: string | number | Date | null) {
  return parseGTDate(input ?? null);
}

export function formatGT(input?: string | number | Date | null) {
  const d = toDate(input);
  if (!d) return '—';
  return format(d, 'dd/MM/yyyy', { locale: es });
}

export function formatGTDateTime(
  input?: string | number | Date | null,
  fmt: string = 'dd/MM/yyyy HH:mm',
) {
  const d = toDate(input);
  if (!d) return '—';
  return format(d, fmt, { locale: es });
}

export function getTime(input?: string | number | Date | null) {
  const d = toDate(input);
  return d ? d.getTime() : 0;
}

function toStartOfDayISOStringGT(input: Date) {
  const parts = dayFormatterGT.formatToParts(input);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}T00:00:00Z`;
}

// Devuelve un Date en start-of-day de Guatemala
export function startOfDayGT(d: Date | string | number): Date {
  const base = parseGTDate(d as Date | string | number) ?? new Date(NaN);
  if (Number.isNaN(base.getTime())) {
    return new Date(NaN);
  }
  const iso = toStartOfDayISOStringGT(base);
  return iso ? new Date(iso) : new Date(NaN);
}

const MS_IN_DAY = 86_400_000;

// Diferencia de días calendario (floor) en zona GT
export function elapsedDaysGT(fromISO: string | Date, now: Date = new Date()): number {
  const from = startOfDayGT(fromISO);
  const current = startOfDayGT(now);
  if (Number.isNaN(from.getTime()) || Number.isNaN(current.getTime())) {
    return 0;
  }
  return Math.floor((current.getTime() - from.getTime()) / MS_IN_DAY);
}

// Devuelve "0 días" | "1 día" | "N días"
export function formatElapsedDaysLabel(days: number): string {
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}
