"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export type FiltersVariant = "bar" | "drawer";

export type FiltersRender = (variant: FiltersVariant) => React.ReactNode;

export interface FilterChip {
  id: string;
  label: string;
  onRemove?: () => void;
}

interface FilterChipsProps {
  chips?: FilterChip[];
  className?: string;
}

export function FilterChips({ chips = [], className }: FilterChipsProps) {
  if (!chips.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="secondary"
          className="flex items-center gap-1 pl-2 pr-1 py-0.5"
        >
          <span className="text-xs font-medium">{chip.label}</span>
          {chip.onRemove ? (
            <button
              type="button"
              onClick={chip.onRemove}
              className="rounded-full p-0.5 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label={`Quitar filtro ${chip.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </Badge>
      ))}
    </div>
  );
}

interface FiltersBarProps {
  renderFilters: FiltersRender;
  chips?: FilterChip[];
  className?: string;
}

export function FiltersBar({ renderFilters, chips, className }: FiltersBarProps) {
  return (
    <div className={cn("hidden md:flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">{renderFilters("bar")}</div>
      <FilterChips chips={chips} />
    </div>
  );
}
