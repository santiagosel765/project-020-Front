"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PDFViewerStatus = "idle" | "loading" | "success" | "failed" | "empty";

type PDFViewerProps = {
  src?: string | null;
  title?: string;
  className?: string;
  /** Callback that refreshes the presigned URL links */
  onRefresh?: () => Promise<void> | void;
  /** Indicates whether the parent component is already refreshing the links */
  isRefreshing?: boolean;
  /**
   * Time in milliseconds to wait before declaring the iframe failed.
   * Defaults to 6000ms.
   */
  timeoutMs?: number;
};

export function PDFViewer({
  src,
  title,
  className,
  onRefresh,
  isRefreshing = false,
  timeoutMs = 6000,
}: PDFViewerProps) {
  const [status, setStatus] = useState<PDFViewerStatus>(() => (!src ? "empty" : "loading"));
  const timeoutRef = useRef<number>();
  const autoRefreshRef = useRef(false);

  useEffect(() => {
    if (!src) {
      setStatus("empty");
      return;
    }

    setStatus("loading");
    autoRefreshRef.current = false;

    timeoutRef.current = window.setTimeout(() => {
      setStatus((prev) => {
        if (prev === "loading") {
          if (onRefresh && !autoRefreshRef.current) {
            autoRefreshRef.current = true;
            void Promise.resolve(onRefresh()).catch(() => undefined);
          }
          return "failed";
        }
        return prev;
      });
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onRefresh, src, timeoutMs]);

  const handleLoad = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setStatus("success");
  }, []);

  const handleManualRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setStatus("loading");
    autoRefreshRef.current = true;
    try {
      await onRefresh();
    } catch (error) {
      setStatus("failed");
    }
  }, [onRefresh]);

  const containerClass = cn(
    "relative block w-full min-h-full rounded-xl border bg-background overflow-auto overscroll-y-contain touch-pan-y",
    className,
  );

  if (status === "empty") {
    return (
      <div className={containerClass}>
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Sin vista disponible
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={containerClass}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">No se pudo cargar el PDF.</p>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              )}
              Actualizar vínculo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <iframe
        title={title ?? "Visor de PDF"}
        src={src ?? undefined}
        className="block h-full w-full min-h-full"
        referrerPolicy="no-referrer"
        allow="fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        onError={() => setStatus("failed")}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{isRefreshing ? "Actualizando vínculo..." : "Cargando documento..."}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
