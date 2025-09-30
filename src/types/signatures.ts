export type SignSource =
  | { mode: 'stored' }
  | { mode: 'draw'; dataUrl: string }
  | { mode: 'upload'; file: File };
