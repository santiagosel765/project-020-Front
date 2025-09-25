"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PDFViewer } from "./PDFViewer";

export type DocumentTabValue = "firmas" | "original";

type DocumentTabsProps = {
  urlCuadroFirmasPDF?: string | null;
  urlDocumento?: string | null;
  onRefreshLinks: () => Promise<void>;
  isRefreshingLinks?: boolean;
  onTabChange?: (tab: DocumentTabValue) => void;
};

export function DocumentTabs({
  urlCuadroFirmasPDF,
  urlDocumento,
  onRefreshLinks,
  isRefreshingLinks = false,
  onTabChange,
}: DocumentTabsProps) {
  const [activeTab, setActiveTab] = useState<DocumentTabValue>("firmas");
  const [tabbarHeight, setTabbarHeight] = useState(0);
  const tabbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === "1") {
        event.preventDefault();
        setActiveTab("firmas");
      }
      if (event.key === "2") {
        event.preventDefault();
        setActiveTab("original");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as DocumentTabValue);
  };

  useEffect(() => {
    const element = tabbarRef.current;
    if (!element) return;

    const updateHeight = () => {
      setTabbarHeight(element.offsetHeight);
    };

    updateHeight();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateHeight) : null;
    resizeObserver?.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const style: CSSProperties = {
    // Provide a fallback height so the PDF container always has a value
    ["--tabbar-h" as const]: `${tabbarHeight}px`,
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" style={style}>
      <div
        ref={tabbarRef}
        className="sticky top-[var(--app-header-h)] z-20 mb-3 border-b border-border bg-background/80 pb-1 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-xs font-medium sm:text-sm">
          <TabsTrigger value="firmas" className="rounded-md px-2 py-2">
            Cuadro de firmas
          </TabsTrigger>
          <TabsTrigger value="original" className="rounded-md px-2 py-2">
            Documento original
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="firmas" className="mt-0 space-y-4">
        <PDFViewer
          title="Cuadro de firmas"
          src={urlCuadroFirmasPDF ?? undefined}
          onRefresh={onRefreshLinks}
          isRefreshing={isRefreshingLinks}
        />
      </TabsContent>

      <TabsContent value="original" className="mt-0 space-y-4">
        <PDFViewer
          title="Documento original"
          src={urlDocumento ?? undefined}
          onRefresh={onRefreshLinks}
          isRefreshing={isRefreshingLinks}
        />
      </TabsContent>
    </Tabs>
  );
}

export default DocumentTabs;
