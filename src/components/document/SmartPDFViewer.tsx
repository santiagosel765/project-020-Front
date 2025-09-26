"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** URL absoluta del PDF (S3 firmado) */
  srcPdf?: string | null;
  className?: string;
  openLabel?: string;
  /** ms para declarar que iframe no cargó y probar <embed> */
  timeoutMs?: number;
};

export default function SmartPDFViewer({
  srcPdf,
  className,
  openLabel = "Abrir documento",
  timeoutMs = 2500,
}: Props) {
  const src = useMemo(() => (srcPdf ?? null), [srcPdf]);
  const [renderMode, setRenderMode] = useState<"iframe" | "embed" | "link">("iframe");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRenderMode("iframe");
    setLoaded(false);
    if (!src || timeoutMs <= 0) return;
    const t = window.setTimeout(() => {
      if (!loaded) setRenderMode("embed"); // iOS a veces no pinta el iframe en modales
    }, timeoutMs);
    return () => window.clearTimeout(t);
  }, [src, timeoutMs, loaded]);

  const container = cn(
    "relative w-full rounded-xl border bg-background overflow-hidden",
    className,
  );

  if (!src) {
    return (
      <div className={container}>
        <div className="grid h-[40vh] place-items-center text-sm text-muted-foreground">
          Sin vista disponible
        </div>
      </div>
    );
  }

  return (
    <div className={container} role="document" aria-label="Visor de PDF">
      {renderMode === "iframe" && (
        <iframe
          key={src} // fuerza recarga si cambia el archivo
          src={src}
          className="block h-full w-full"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setRenderMode("embed")}
        />
      )}

      {renderMode === "embed" && (
        <embed
          key={src + "#embed"} // alternativa que suele funcionar en iOS
          src={src}
          type="application/pdf"
          className="block h-full w-full"
          onLoad={() => setLoaded(true)}
          onError={() => setRenderMode("link")}
        />
      )}

      {renderMode === "link" && (
        <div className="absolute inset-0 grid place-items-center p-4">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border bg-background px-3 py-2 text-sm shadow"
          >
            {openLabel}
          </a>
        </div>
      )}

      {/* Quick action siempre visible */}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-xl border bg-background/80 px-3 py-2 text-xs shadow"
      >
        {openLabel}
      </a>
    </div>
  );
}
