import type { PageDto } from '@/types/me';

const DEFAULT_FALLBACK = '/general';
const MIS_DOCUMENTOS_PATH = '/gsign/mis-documentos';

export function getInitialRoute(pages: PageDto[] = [], fallback: string = DEFAULT_FALLBACK): string {
  if (!Array.isArray(pages) || pages.length === 0) {
    return fallback;
  }

  const documentsPage = pages.find((page) => page.path === MIS_DOCUMENTOS_PATH);
  if (documentsPage?.path) {
    return documentsPage.path;
  }

  const [firstPage] = [...pages]
    .filter((page) => Boolean(page?.path))
    .sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.path ?? '').localeCompare(b.path ?? '');
    });

  return firstPage?.path ?? fallback;
}
