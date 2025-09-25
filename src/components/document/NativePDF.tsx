"use client";

import { cn } from "@/lib/utils";

export default function NativePDF({
  src,
  className,
  openLabel = "Abrir en nueva pestaña",
}: { src: string | null | undefined; className?: string; openLabel?: string }) {
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!src) {
    return (
      <div className={cn("grid min-h-[240px] place-items-center rounded-xl border text-sm text-muted-foreground", className)}>
        Sin vista disponible
      </div>
    );
  }
  return (
    <div className={cn("relative min-h-0 w-full flex-1 overflow-hidden rounded-xl border bg-background", className)}>
      {isIOS && (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 z-20 rounded-xl border bg-background/80 px-3 py-2 text-sm shadow"
        >
          {openLabel}
        </a>
      )}
      {/* Visor nativo (Chrome/Edge/Firefox) o QuickLook (iOS) */}
      <object data={src} type="application/pdf" className="h-full w-full">
        <iframe src={src} className="h-full w-full" title="PDF" />
      </object>
    </div>
  );
}
