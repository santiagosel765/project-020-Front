"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** URL absoluta del PDF (S3 firmado) */
  srcPdf?: string | null;
  src?: string | null;
  title?: string;
  className?: string;
  openLabel?: string;
};

export default function SmartPDFViewer({
  srcPdf,
  src,
  title,
  className,
  openLabel = "Abrir documento",
}: Props) {
  const resolvedSrc = useMemo(() => src ?? srcPdf ?? null, [src, srcPdf]);
  const [renderMode, setRenderMode] = useState<"iframe" | "link">(() =>
    resolvedSrc ? "iframe" : "link",
  );

  useEffect(() => {
    if (!resolvedSrc) {
      setRenderMode("link");
      return;
    }

    setRenderMode("iframe");
  }, [resolvedSrc]);

  const container = cn(
    "relative h-full w-full touch-pan-y overscroll-contain rounded-xl border bg-background",
    className,
  );

  if (!resolvedSrc) {
    return (
      <div className={container} style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="grid h-[40vh] place-items-center text-sm text-muted-foreground">
          Sin vista disponible
        </div>
      </div>
    );
  }

  return (
    <div
      className={container}
      style={{ WebkitOverflowScrolling: "touch" }}
      role="document"
      aria-label="Visor de PDF"
    >
      {renderMode === "iframe" && (
        <iframe
          key={resolvedSrc}
          src={resolvedSrc}
          title={title ?? "PDF"}
          className="block h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          scrolling="yes"
          onError={() => setRenderMode("link")}
        />
      )}

      {renderMode === "link" && (
        <div className="absolute inset-0 grid place-items-center p-4 text-sm text-muted-foreground">
          No se pudo cargar la vista previa.
        </div>
      )}

      <a
        href={resolvedSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-xl border bg-background/80 px-3 py-2 text-xs shadow"
      >
        {openLabel}
      </a>
    </div>
  );
}
