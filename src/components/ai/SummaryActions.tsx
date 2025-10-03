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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button onClick={onGenerate} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Generando…" : "Generar Resumen IA"}
      </Button>
      <Button
        variant="outline"
        onClick={onCopy}
        disabled={disabled || isLoading}
        className="min-w-[110px]"
      >
        <Copy className="mr-2 h-4 w-4" />
        Copiar
      </Button>
      <Button
        variant="outline"
        onClick={onDownload}
        disabled={disabled || isLoading}
        className="min-w-[130px]"
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar
      </Button>
    </div>
  );
}
