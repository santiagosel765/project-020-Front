"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type HeadlessPopoverProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  anchorRef: React.RefObject<HTMLElement>;
  width?: number;
  offset?: number;
  className?: string;
  children: React.ReactNode;
};

export function HeadlessPopover({
  open,
  onOpenChange,
  anchorRef,
  width = 384,
  offset = 8,
  className,
  children,
}: HeadlessPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (!panel || !anchor) return;
      const target = e.target as Node;
      if (!panel.contains(target) && !anchor.contains(target)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open, onOpenChange, anchorRef]);

  const computePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const top = Math.round(rect.bottom + offset);
    const left = Math.round(Math.min(Math.max(16, rect.right - width), vw - width - 16));
    setStyle({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 1000,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const onResize = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted || !open) return null;
  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="false" className={className} style={style}>
      {children}
    </div>,
    document.body,
  );
}
