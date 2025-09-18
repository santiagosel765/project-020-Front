"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationBarProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_OPTIONS as unknown as number[],
  className,
}: PaginationBarProps) {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_OPTIONS[0];
  const pages = Math.max(1, Math.ceil((Number.isFinite(total) ? Math.max(0, total) : 0) / size) || 1);
  const currentPage = Math.min(Math.max(1, Math.floor(page || 1)), pages);

  const options = useMemo(() => {
    const set = new Set<number>();
    [...pageSizeOptions, size].forEach((value) => {
      if (Number.isFinite(value) && value > 0) set.add(Math.floor(value));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [pageSizeOptions, size]);

  const handleFirst = () => {
    if (currentPage > 1) onPageChange(1);
  };
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < pages) onPageChange(currentPage + 1);
  };
  const handleLast = () => {
    if (currentPage < pages) onPageChange(pages);
  };

  return (
    <div
      className={cn(
        "border-t px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {pages} — {total ?? 0} registros
      </span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isFinite(next) && next > 0) onPageSizeChange(Math.floor(next));
            }}
          >
            <SelectTrigger className="w-[120px]" aria-label="Registros por página">
              <SelectValue placeholder={`${size}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFirst}
            disabled={currentPage <= 1}
            aria-label="Primera página"
          >
            ⏮︎
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            ⟨ Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage >= pages}
            aria-label="Página siguiente"
          >
            Siguiente ⟩
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLast}
            disabled={currentPage >= pages}
            aria-label="Última página"
          >
            ⏭︎
          </Button>
        </div>
      </div>
    </div>
  );
}

