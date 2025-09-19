const GT_TZ = 'America/Guatemala';

const dayFormatterGT = new Intl.DateTimeFormat('es-GT', {
  timeZone: GT_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function toDate(input?: string | Date | null) {
  if (!input) return null;
  return typeof input === 'string' ? new Date(input) : input;
}

export function formatGT(input?: string | Date | null) {
  const d = toDate(input);
  if (!d) return '';
  return dayFormatterGT.format(d);
}

export function formatGTDateTime(
  input?: string | Date | null,
  opts?: { ampm?: 'upper' | 'locale' }
) {
  const d = toDate(input);
  if (!d) return '';
  let out = new Intl.DateTimeFormat('es-GT', {
    timeZone: GT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  if (opts?.ampm === 'upper') {
    // “a. m.” / “p. m.” -> “AM” / “PM”
    out = out.replace(/\b(a\.?\s?m\.?|p\.?\s?m\.?)\b/gi, (m) =>
      m.toUpperCase().replace(/[.\s]/g, '')
    );
  }
  return out;
}

export function getTime(input?: string | Date | null) {
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
  const base = new Date(d);
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
