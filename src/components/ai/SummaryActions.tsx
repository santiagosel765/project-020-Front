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
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <Button
        onClick={onGenerate}
        disabled={isLoading}
        className="h-11 rounded-full px-5 text-sm font-medium sm:h-10"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Generando…" : "Generar Resumen IA"}
      </Button>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-initial">
        <Button
          variant="outline"
          onClick={onCopy}
          disabled={disabled || isLoading}
          className="h-11 rounded-full px-4 sm:h-10"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copiar
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          disabled={disabled || isLoading}
          className="h-11 rounded-full px-4 sm:h-10"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar
        </Button>
      </div>
    </div>
  );
}
