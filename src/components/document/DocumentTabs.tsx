"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import SmartPDFViewer from "./SmartPDFViewer";

export type DocumentTabValue = "firmas" | "original";

type DocumentTabsProps = {
  urlCuadroFirmasPDF?: string | null;
  urlDocumento?: string | null;
  onTabChange?: (tab: DocumentTabValue) => void;
};

const queryToTab = (value: string | null): DocumentTabValue => {
  if (!value) return "original";
  if (value === "cuadro" || value === "firmas") return "firmas";
  return "original";
};

const tabToQuery = (value: DocumentTabValue): "documento" | "cuadro" =>
  value === "firmas" ? "cuadro" : "documento";

export function DocumentTabs({
  urlCuadroFirmasPDF,
  urlDocumento,
  onTabChange,
}: DocumentTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<DocumentTabValue>(() =>
    queryToTab(searchParams?.get("tab") ?? null),
  );
  const [tabbarHeight, setTabbarHeight] = useState(0);
  const tabbarRef = useRef<HTMLDivElement | null>(null);
  const paramsKey = searchParams?.toString();

  const updateQuery = (nextTab: DocumentTabValue) => {
    const queryValue = tabToQuery(nextTab);
    const nextParams = new URLSearchParams(searchParams?.toString());

    if (nextTab === "original") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", queryValue);
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const changeTab = (nextTab: DocumentTabValue) => {
    setActiveTab(nextTab);
    updateQuery(nextTab);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === "1") {
        event.preventDefault();
        changeTab("original");
      }
      if (event.key === "2") {
        event.preventDefault();
        changeTab("firmas");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const current = queryToTab(searchParams?.get("tab") ?? null);
    setActiveTab((prev) => (prev === current ? prev : current));
  }, [paramsKey]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const handleTabChange = (value: string) => {
    const nextTab = value as DocumentTabValue;
    changeTab(nextTab);
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

  const style = {
    // Provide a fallback height so the PDF container always has a value
    "--tabbar-h": `${tabbarHeight}px`,
  } as CSSProperties;

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex h-full w-full flex-col"
      style={style}
    >
      <div
        ref={tabbarRef}
        className="sticky top-[var(--app-header-h)] z-20 mb-3 border-b border-border bg-background/80 pb-1 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-lg bg-muted p-1 text-xs font-medium sm:text-sm">
          <TabsTrigger value="original" className="rounded-md px-2 py-2">
            Documento original
          </TabsTrigger>
          <TabsTrigger value="firmas" className="rounded-md px-2 py-2">
            Cuadro de firmas
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="original" className="mt-0 flex-1 data-[state=inactive]:hidden">
        <div className="w-full min-h-[60vh] md:min-h-[70vh] overflow-hidden rounded-lg border bg-background">
          <SmartPDFViewer
            srcPdf={urlDocumento ?? null}
            className="h-full w-full overflow-auto"
          />
        </div>
      </TabsContent>

      <TabsContent value="firmas" className="mt-0 flex-1 data-[state=inactive]:hidden">
        <div className="w-full min-h-[60vh] md:min-h-[70vh] overflow-hidden rounded-lg border bg-background">
          <SmartPDFViewer
            srcPdf={urlCuadroFirmasPDF ?? null}
            className="h-full w-full overflow-auto"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default DocumentTabs;
