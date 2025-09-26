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
    <div
      className={cn("w-full", className)}
      style={{
        height: "calc(100dvh - 220px)",
        overflow: "hidden",
      }}
    >
      <SmartPDFViewer src={pdfUrl ?? null} openLabel={openLabel} className="h-full w-full" />
    </div>
  );
}
