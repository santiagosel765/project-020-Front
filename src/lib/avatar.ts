export const initials = (name: string) =>
  name?.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '??';

export function fullName(u?: {
  primer_nombre?: string | null;
  segundo_name?: string | null;
  tercer_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  apellido_casada?: string | null;
}) {
  if (!u) return '';
  const parts = [
    u.primer_nombre,
    u.segundo_name,
    u.tercer_nombre,
    u.primer_apellido,
    u.segundo_apellido,
    u.apellido_casada,
  ].filter(Boolean);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function initialsFromUser(u: Parameters<typeof fullName>[0]) {
  const name = fullName(u);
  const ini = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
  return ini || '??';
}

export function subtitleFromUser(u: any) {
  const pos = u?.posicion?.nombre || '';
  const ger = u?.gerencia?.nombre || '';
  const cod = u?.codigo_empleado || '';
  const left = [pos || ger].filter(Boolean).join(' / ');
  return [left, cod].filter(Boolean).join(' — ') || '—';
}
