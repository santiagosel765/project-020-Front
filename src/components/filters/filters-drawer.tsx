"use client";

import * as React from "react";
import { Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import type { FilterChip, FiltersRender } from "./filters-bar";
import { FilterChips } from "./filters-bar";

interface FiltersDrawerProps {
  renderFilters: FiltersRender;
  chips?: FilterChip[];
  title?: string;
  triggerLabel?: string;
  className?: string;
}

export function FiltersDrawer({
  renderFilters,
  chips,
  title = "Filtros",
  triggerLabel = "Filtros",
  className,
}: FiltersDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("md:hidden", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={() => setOpen(true)}
      >
        <Filter className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex h-full w-[min(360px,90vw)] flex-col gap-6">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {renderFilters("drawer")}
          </div>
          <FilterChips chips={chips} className="border-t pt-4" />
        </SheetContent>
      </Sheet>
    </div>
  );
}
