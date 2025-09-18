'use client';
import React from 'react';
import { formatGT, formatGTDateTime } from '@/lib/date';

export function DateCell({
  value,
  withTime = false,
  ampm = 'upper',
}: { value?: string | Date | null; withTime?: boolean; ampm?: 'upper' | 'locale' }) {
  const shown = withTime ? formatGTDateTime(value, { ampm }) : formatGT(value);
  const title = formatGTDateTime(value, { ampm: 'upper' }) || '';
  return <span title={title}>{shown || '—'}</span>;
}
