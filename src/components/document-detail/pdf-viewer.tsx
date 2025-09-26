'use client';

import SmartPDFViewer from '@/components/document/SmartPDFViewer';

export function DocumentPdfViewer({
  pdfUrl,
  className,
  openLabel,
}: {
  pdfUrl?: string | null;
  className?: string;
  openLabel?: string;
}) {
  return <SmartPDFViewer srcPdf={pdfUrl ?? null} className={className} openLabel={openLabel} />;
}
