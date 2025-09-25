"use client";

import SmartPDFViewer from '@/components/document/SmartPDFViewer';

type DocumentPdfViewerProps = {
  pdfUrl?: string | null;
  className?: string;
  openLabel?: string;
};

export function DocumentPdfViewer({ pdfUrl, className, openLabel }: DocumentPdfViewerProps) {
  return <SmartPDFViewer srcPdf={pdfUrl ?? null} className={className} openLabel={openLabel} />;
}
