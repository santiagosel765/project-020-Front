"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentPdfViewerProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
}

export function DocumentPdfViewer({ src, className, ...props }: DocumentPdfViewerProps) {
  return (
    <iframe
      src={src}
      className={cn('w-full h-[70vh] rounded-xl bg-muted', className)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
