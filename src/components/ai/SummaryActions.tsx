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
    <div
      className={cn(
        "flex flex-col gap-2 text-sm sm:flex-row sm:items-center",
        className,
      )}
    >
      <Button
        onClick={onGenerate}
        disabled={isLoading}
        size="sm"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Generando…" : "Generar Resumen IA"}
      </Button>
      <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
        <Button
          variant="secondary"
          onClick={onCopy}
          disabled={disabled || isLoading}
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copiar
        </Button>
        <Button
          variant="secondary"
          onClick={onDownload}
          disabled={disabled || isLoading}
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </Button>
      </div>
    </div>
  );
}
