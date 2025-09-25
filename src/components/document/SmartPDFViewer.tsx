"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewerStatus = "idle" | "loading" | "success" | "failed" | "empty";

type SmartPDFViewerProps = {
  src?: string | null;
  title?: string;
  className?: string;
  /** Callback that refreshes the presigned URL links */
  onRefresh?: () => Promise<void> | void;
  /** Indicates whether the parent component is already refreshing the links */
  isRefreshing?: boolean;
  /** Timeout in milliseconds before declaring the iframe failed */
  timeoutMs?: number;
};

const IOS_PLATFORM_REGEX = /\b(iPad|iPhone|iPod)\b/i;

function detectIOS(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const platform = navigator.platform ?? "";
  const userAgent = navigator.userAgent ?? "";
  const isIOSDevice = IOS_PLATFORM_REGEX.test(platform) || IOS_PLATFORM_REGEX.test(userAgent);
  const isIpadOs = navigator.maxTouchPoints > 1 && /Macintosh/.test(userAgent);

  return isIOSDevice || isIpadOs;
}

export function SmartPDFViewer({
  src,
  title,
  className,
  onRefresh,
  isRefreshing = false,
  timeoutMs = 6000,
}: SmartPDFViewerProps) {
  const [status, setStatus] = useState<ViewerStatus>(() => (!src ? "empty" : "loading"));
  const timeoutRef = useRef<number>();
  const autoRefreshRef = useRef(false);
  const [isIOS, setIsIOS] = useState(false);

  const viewerUrl = useMemo(() => {
    if (!src) return undefined;
    const encoded = encodeURIComponent(src);
    return `/pdfjs/web/viewer.html?file=${encoded}#zoom=page-width`;
  }, [src]);

  useEffect(() => {
    setIsIOS(detectIOS());
  }, []);

  useEffect(() => {
    if (!src) {
      setStatus("empty");
      return;
    }

    setStatus("loading");
    autoRefreshRef.current = false;

    if (timeoutMs <= 0) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setStatus((previous) => {
        if (previous === "loading") {
          if (onRefresh && !autoRefreshRef.current) {
            autoRefreshRef.current = true;
            void Promise.resolve(onRefresh()).catch(() => undefined);
          }
          return "failed";
        }
        return previous;
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

  const handleError = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setStatus("failed");
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

  const handleOpenInNewTab = useCallback(() => {
    if (!src) return;
    window.open(src, "_blank", "noopener,noreferrer");
  }, [src]);

  const containerClass = cn(
    "relative block h-full w-full overflow-auto rounded-xl border bg-background",
    "overscroll-y-contain touch-pan-y [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]",
    className,
  );

  if (status === "empty") {
    return (
      <div className={containerClass} role="document" aria-label={title ?? "Visor de PDF"}>
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Sin vista disponible
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={containerClass} role="document" aria-label={title ?? "Visor de PDF"}>
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
          {src && (
            <Button variant="ghost" size="sm" onClick={handleOpenInNewTab} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir en pestaña nueva
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={containerClass}
      role="document"
      aria-label={title ?? "Visor de PDF"}
      aria-busy={status === "loading"}
    >
      {viewerUrl && (
        <iframe
          key={viewerUrl}
          title={title ?? "Visor de PDF"}
          src={viewerUrl}
          className="block h-full w-full"
          referrerPolicy="no-referrer"
          allow="fullscreen"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{isRefreshing ? "Actualizando vínculo..." : "Cargando documento..."}</span>
          </div>
        </div>
      )}

      {isIOS && src && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-3 right-3 h-9 w-9 rounded-full shadow-md"
          onClick={handleOpenInNewTab}
          title="Abrir en una pestaña nueva"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Abrir en pestaña nueva</span>
        </Button>
      )}
    </div>
  );
}

export default SmartPDFViewer;
