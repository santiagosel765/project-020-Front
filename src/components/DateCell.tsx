'use client';
import React from 'react';
import { formatGT, formatGTDateTime } from '@/lib/date';

export function DateCell({ value, withTime = false }: { value?: string | Date | null; withTime?: boolean }) {
  const shown = withTime ? formatGTDateTime(value) : formatGT(value);
  const title = formatGTDateTime(value) || '';
  return <span title={title}>{shown || '—'}</span>;
}
