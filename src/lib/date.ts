const GT_TZ = 'America/Guatemala';

function toDate(input?: string | Date | null) {
  if (!input) return null;
  return typeof input === 'string' ? new Date(input) : input;
}

export function formatGT(input?: string | Date | null) {
  const d = toDate(input);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: GT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
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
