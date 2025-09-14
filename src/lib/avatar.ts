export const initials = (name: string) =>
  name?.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '??';
