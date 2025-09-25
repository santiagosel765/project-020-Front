"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** URL absoluta del PDF (S3 firmado) */
  srcPdf: string | null | undefined;
  className?: string;
  /** Texto del botón abrir en nueva pestaña (iOS) */
  openLabel?: string;
};

export default function SmartPDFViewer({ srcPdf, className, openLabel = "Abrir en nueva pestaña" }: Props) {
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  const viewerSrc = useMemo(() => {
    if (!srcPdf) return null;
    const file = encodeURIComponent(srcPdf);
    // Usamos nuestro viewer local
    return `/pdfjs/web/viewer.html?file=${file}`;
  }, [srcPdf]);

  if (!srcPdf) {
    return (
      <div
        className={cn(
          "relative w-full rounded-xl border bg-background text-muted-foreground grid place-items-center",
          "min-h-[60vh]",
          className,
        )}
      >
        Sin vista disponible
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-xl border bg-background",
        // contenedor scroll propio para no pelear con la página
        "h-[calc(100dvh-var(--app-header-h)-theme(spacing.24))] md:h-[calc(100dvh-var(--app-header-h)-theme(spacing.16))]",
        "overflow-auto overscroll-y-contain touch-pan-y",
        className,
      )}
    >
      {/* iOS: ofrecer abrir en nueva pestaña (mejor experiencia en algunos WKWebView) */}
      {isIOS && viewerSrc && (
        <a
          href={viewerSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 z-20 rounded-xl border bg-background/80 px-3 py-2 text-sm shadow"
        >
          {openLabel}
        </a>
      )}

      {viewerSrc && (
        <iframe
          title="Visor de PDF"
          src={viewerSrc}
          className="block h-full w-full"
          referrerPolicy="no-referrer"
          // ⚠ Quitar allowFullScreen para evitar el warning
          allow="fullscreen"
          // Sandbox mínimo para el visor (scripts + same-origin para worker)
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
        />
      )}
    </div>
  );
}
