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
import { pageDebug } from "@/lib/page-debug";

const DEFAULT_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationBarProps {
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
}

export function PaginationBar({
  total,
  page,
  pages,
  limit,
  hasPrev,
  hasNext,
  onPageChange,
  onLimitChange,
  limitOptions = DEFAULT_OPTIONS as unknown as number[],
  className,
}: PaginationBarProps) {
  const size = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_OPTIONS[0];
  const totalPages = Number.isFinite(pages) && pages > 0 ? Math.floor(pages) : 1;
  const currentPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const options = useMemo(() => {
    const set = new Set<number>();
    [...limitOptions, size].forEach((value) => {
      if (Number.isFinite(value) && value > 0) set.add(Math.floor(value));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [limitOptions, size]);

  const handlePrev = () => {
    if (!hasPrev || currentPage <= 1) return;
    pageDebug("src/components/pagination/PaginationBar.tsx:56:onPageChange", {
      from: currentPage,
      to: currentPage - 1,
    });
    onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (!hasNext) return;
    pageDebug("src/components/pagination/PaginationBar.tsx:65:onPageChange", {
      from: currentPage,
      to: currentPage + 1,
    });
    onPageChange(currentPage + 1);
  };

  return (
    <div
      className={cn(
        "border-t px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages} — {total ?? 0} registros
      </span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select
            value={String(size)}
            onValueChange={(value) => {
              const next = Number(value);
              if (Number.isFinite(next) && next > 0) onLimitChange(Math.floor(next));
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
            onClick={handlePrev}
            disabled={!hasPrev || currentPage <= 1}
            aria-label="Página anterior"
          >
            ⟨ Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext}
            aria-label="Página siguiente"
          >
            Siguiente ⟩
          </Button>
        </div>
      </div>
    </div>
  );
}
