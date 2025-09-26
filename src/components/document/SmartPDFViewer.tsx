"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SmartPDFViewerProps = {
  src?: string | null;
  srcPdf?: string | null;
  openLabel?: string;
  className?: string;
  title?: string;
};

export function SmartPDFViewer({
  src,
  srcPdf,
  openLabel = "Abrir documento",
  className,
  title,
}: SmartPDFViewerProps) {
  const resolvedSrc = React.useMemo(() => src ?? srcPdf ?? null, [src, srcPdf]);
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [resolvedSrc]);

  if (!resolvedSrc) {
    return (
      <div className={cn("grid h-full w-full place-items-center p-4", className)}>
        <span className="text-sm text-muted-foreground">No hay PDF disponible.</span>
      </div>
    );
  }

  if (errored) {
    return (
      <div className={cn("grid h-full w-full place-items-center p-4", className)}>
        <a
          href={resolvedSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border bg-background px-3 py-2 text-sm shadow"
        >
          {openLabel}
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn("relative h-full w-full touch-pan-y overscroll-contain", className)}
      style={{ WebkitOverflowScrolling: "touch" }}
      data-loaded={loaded ? "true" : "false"}
    >
      <iframe
        key={resolvedSrc}
        src={resolvedSrc}
        title={title ?? "PDF"}
        className="block h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        scrolling="yes"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      <div className="pointer-events-none absolute bottom-3 right-3">
        <a
          href={resolvedSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto rounded-lg border bg-background px-3 py-2 text-sm shadow"
        >
          {openLabel}
        </a>
      </div>
    </div>
  );
}

export default SmartPDFViewer;
