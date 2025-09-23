"use client";

import { useEffect, useState } from "react";

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

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="sticky top-0 z-20 mb-3 bg-background/90 pb-1 pt-2 backdrop-blur">
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
