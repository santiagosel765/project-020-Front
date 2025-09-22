"use client";

import { elapsedDaysGT, formatElapsedDaysLabel, formatGTDateTime } from '@/lib/date';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  fromISO?: string | null;
  title?: string;
};

export function ElapsedDaysCell({ fromISO, title }: Props) {
  if (!fromISO) {
    return <span className="text-muted-foreground">—</span>;
  }

  const days = elapsedDaysGT(fromISO);
  const label = formatElapsedDaysLabel(days);
  const formatted = formatGTDateTime(fromISO);
  const tooltip = title ?? (formatted !== '—' ? `${formatted} GT` : label);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground" aria-label={label}>
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
