'use client';

import NativePDF from '@/components/document/NativePDF';

export function DocumentPdfViewer({
  pdfUrl,
  className,
  openLabel,
}: {
  pdfUrl?: string | null;
  className?: string;
  openLabel?: string;
}) {
  return <NativePDF src={pdfUrl ?? null} className={className} openLabel={openLabel} />;
}
