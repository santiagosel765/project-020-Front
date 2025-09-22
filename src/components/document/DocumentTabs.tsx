"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { PDFViewer } from "./PDFViewer";

type TabValue = "firmas" | "original";

type SummaryStatus = "idle" | "success" | "error";

type SaveStatus = "idle" | "saving" | "success" | "error";

type DocumentTabsProps = {
  urlCuadroFirmasPDF?: string | null;
  urlDocumento?: string | null;
  onRefreshLinks: () => Promise<void>;
  isRefreshingLinks?: boolean;
  onSummarize?: () => Promise<void> | void;
  summarizing?: boolean;
  summaryStatus?: SummaryStatus;
  summaryError?: string | null;
  summaryText?: string | null;
  onSaveSummary?: () => Promise<void> | void;
  saveStatus?: SaveStatus;
};

export function DocumentTabs({
  urlCuadroFirmasPDF,
  urlDocumento,
  onRefreshLinks,
  isRefreshingLinks = false,
  onSummarize,
  summarizing = false,
  summaryStatus = "idle",
  summaryError = null,
  summaryText = null,
  onSaveSummary,
  saveStatus = "idle",
}: DocumentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("firmas");
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (summaryText) {
      setSummaryOpen(true);
    }
  }, [summaryText]);

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
    if (summaryStatus === "success" && activeTab !== "original") {
      setActiveTab("original");
    }
  }, [summaryStatus, activeTab]);

  const summaryHelperText = useMemo(() => {
    if (summaryStatus === "success") {
      return "Resumen generado correctamente.";
    }
    if (summaryStatus === "error" && summaryError) {
      return summaryError;
    }
    return null;
  }, [summaryError, summaryStatus]);

  const saveHelperText = useMemo(() => {
    if (saveStatus === "success") {
      return "Resumen guardado exitosamente.";
    }
    if (saveStatus === "error") {
      return "No se pudo guardar el resumen.";
    }
    return null;
  }, [saveStatus]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
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

        <Card className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <h3 className="font-medium">Resumen con IA</h3>
                <p className="text-sm text-muted-foreground">
                  Genera un resumen ejecutivo del documento original.
                </p>
              </div>
            </div>
            <Button
              onClick={() => onSummarize && onSummarize()}
              disabled={summarizing || !onSummarize}
              className="sm:w-auto"
            >
              {summarizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Resumiendo...
                </>
              ) : (
                "Resumir documento"
              )}
            </Button>
          </div>

          {summaryHelperText && (
            <p
              className={cn("text-sm", summaryStatus === "error" ? "text-destructive" : "text-muted-foreground")}
              role="status"
            >
              {summaryHelperText}
            </p>
          )}

          {summaryText ? (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen} className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full items-center justify-between">
                  <span>Ver resumen generado</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      summaryOpen ? "rotate-180" : "rotate-0",
                    )}
                    aria-hidden="true"
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
                  {summaryText}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  {saveHelperText && (
                    <p
                      className={cn(
                        "text-sm", saveStatus === "error" ? "text-destructive" : "text-muted-foreground",
                      )}
                      role="status"
                    >
                      {saveHelperText}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onSaveSummary && onSaveSummary()}
                    disabled={!onSaveSummary || saveStatus === "saving"}
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar resumen"
                    )}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <p className="text-sm text-muted-foreground">
              El resumen aparecerá aquí cuando se genere.
            </p>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default DocumentTabs;
