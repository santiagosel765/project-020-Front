'use client';

import SmartPDFViewer from '@/components/document/SmartPDFViewer';
import { cn } from '@/lib/utils';

export function DocumentPdfViewer({
  pdfUrl,
  className,
  openLabel,
}: {
  pdfUrl?: string | null;
  className?: string;
  openLabel?: string;
}) {
  return (
    <div className={cn("h-[calc(100dvh-220px)] w-full", className)}>
      <SmartPDFViewer src={pdfUrl ?? null} openLabel={openLabel} />
    </div>
  );
}
