"use client";

import React from 'react';
import { cn } from '@/lib/utils';

type DocumentPdfViewerProps = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src'> & {
  pdfUrl: string;
};

export function DocumentPdfViewer({ pdfUrl, className, ...props }: DocumentPdfViewerProps) {
  return (
    <iframe
      src={pdfUrl}
      className={cn('w-full h-[70vh] rounded-xl bg-muted', className)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
