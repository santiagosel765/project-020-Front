"use client";

import { Loader2, Copy, Download, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SummaryActionsProps {
  disabled: boolean;
  isLoading: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onDownload: () => void;
  className?: string;
}

export function SummaryActions({
  disabled,
  isLoading,
  onGenerate,
  onCopy,
  onDownload,
  className,
}: SummaryActionsProps) {
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-2", className)}>
      <Button
        onClick={onGenerate}
        disabled={isLoading}
        size="sm"
        className="flex-1 sm:flex-none"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        <span className="truncate">
          {isLoading ? "Generando…" : "Generar Resumen IA"}
        </span>
      </Button>
      <Button
        variant="secondary"
        onClick={onCopy}
        disabled={disabled || isLoading}
        size="sm"
        className="px-2"
      >
        <Copy className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Copiar</span>
      </Button>
      <Button
        variant="secondary"
        onClick={onDownload}
        disabled={disabled || isLoading}
        size="sm"
        className="px-2"
      >
        <Download className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-2">Descargar</span>
      </Button>
    </div>
  );
}
