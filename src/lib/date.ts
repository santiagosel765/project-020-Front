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

export function formatGTDateTime(input?: string | Date | null) {
  const d = toDate(input);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: GT_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function getTime(input?: string | Date | null) {
  const d = toDate(input);
  return d ? d.getTime() : 0;
}
