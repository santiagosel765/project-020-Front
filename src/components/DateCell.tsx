'use client';
import React from 'react';
import { formatGT, formatGTDateTime } from '@/lib/date';

type DateCellProps = {
  value?: string | number | Date | null;
  withTime?: boolean;
};

export function DateCell({ value, withTime = false }: DateCellProps) {
  const shown = withTime ? formatGTDateTime(value) : formatGT(value);
  const titleValue = formatGTDateTime(value);
  const title = titleValue === '—' ? undefined : titleValue;
  return <span title={title}>{shown}</span>;
}
