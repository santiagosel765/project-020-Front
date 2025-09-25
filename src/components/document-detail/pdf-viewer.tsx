"use client";

import React from 'react';

import { SmartPDFViewer } from '@/components/document/SmartPDFViewer';

type DocumentPdfViewerProps = {
  pdfUrl?: string | null;
  title?: string;
  className?: string;
};

export function DocumentPdfViewer({ pdfUrl, title, className }: DocumentPdfViewerProps) {
  return <SmartPDFViewer src={pdfUrl ?? undefined} title={title} className={className} />;
}
