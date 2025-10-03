"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, Bot, Volume2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  DOCUMENT_SUMMARY_ANALYZE_PATH,
  startDocChat,
} from "@/services/documentsService";

import { DocChatPanel } from "./DocChatPanel";
import { SummaryTTSControls } from "./SummaryTTSControls";

export interface DocumentSummaryDialogProps {
  documentId: number;
  cuadroFirmasId: number;
}

export interface DocumentSummaryDialogHandle {
  open: () => void;
  close: () => void;
  regenerate: () => Promise<void>;
}

type StreamState = {
  controller: AbortController | null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
};

const parseStreamChunk = (raw: string) => {
  return raw
    .split(/\n/)
    .map((line) => line.replace(/^data:\s*/i, ""))
    .filter((line) => line && line !== "[DONE]")
    .join("\n");
};

export const DocumentSummaryDialog = forwardRef<
  DocumentSummaryDialogHandle,
  DocumentSummaryDialogProps
>(({ documentId, cuadroFirmasId }, ref) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const streamState = useRef<StreamState>({ controller: null, reader: null });
  const ttsRef = useRef<any>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const sessionPromiseRef = useRef<Promise<string> | null>(null);

  const abortStreaming = useCallback(() => {
    const { controller, reader } = streamState.current;
    if (controller) {
      controller.abort();
    }
    if (reader) {
      try {
        reader.cancel();
      } catch (error) {
        // ignore cancellation errors
      }
    }
    streamState.current = { controller: null, reader: null };
    setIsLoading(false);
  }, []);

  const stopTTS = useCallback(() => {
    ttsRef.current?.stop();
  }, []);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    if (sessionPromiseRef.current) {
      return sessionPromiseRef.current;
    }
    const promise = startDocChat(cuadroFirmasId)
      .then(({ sessionId: newSessionId }) => {
        setSessionId(newSessionId);
        return newSessionId;
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "No se pudo iniciar el chat",
          description: error?.message || "Intenta nuevamente más tarde.",
        });
        throw error;
      })
      .finally(() => {
        sessionPromiseRef.current = null;
      });
    sessionPromiseRef.current = promise;
    return promise;
  }, [cuadroFirmasId, sessionId, toast]);

  useEffect(() => {
    if (open) {
      setActiveTab("summary");
      void ensureSession().catch(() => undefined);
    } else {
      abortStreaming();
      stopTTS();
    }
  }, [abortStreaming, ensureSession, open, stopTTS]);

  useEffect(() => {
    return () => {
      abortStreaming();
      stopTTS();
    };
  }, [abortStreaming, stopTTS]);

  useEffect(() => {
    abortStreaming();
    stopTTS();
    setSessionId(null);
    sessionPromiseRef.current = null;
    setMarkdown("");
    setError(null);
  }, [abortStreaming, cuadroFirmasId, stopTTS]);

  const generateSummary = useCallback(async () => {
    abortStreaming();
    stopTTS();
    setMarkdown("");
    setError(null);
    setIsLoading(true);
    setActiveTab("summary");

    const controller = new AbortController();
    streamState.current = { controller, reader: null };

    try {
      const response = await fetch(
        `${DOCUMENT_SUMMARY_ANALYZE_PATH}/${cuadroFirmasId}`,
        {
          method: "POST",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo generar el resumen del documento.");
      }

      if (!response.body) {
        const text = await response.text();
        setMarkdown(text);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      streamState.current.reader = reader;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const parsed = parseStreamChunk(chunk);
          if (!parsed) continue;
          setMarkdown((prev) => `${prev}${parsed}`);
        }
      }
      const remaining = decoder.decode();
      if (remaining) {
        const parsed = parseStreamChunk(remaining);
        if (parsed) {
          setMarkdown((prev) => `${prev}${parsed}`);
        }
      }

      toast({
        title: "✨ Resumen generado",
        description: "El resumen IA ha sido creado exitosamente.",
      });
    } catch (error: any) {
      if (controller.signal.aborted) {
        return;
      }
      const description = error?.message || "Intenta nuevamente.";
      setError(description);
      toast({
        variant: "destructive",
        title: "Error al generar resumen",
        description,
      });
    } finally {
      streamState.current = { controller: null, reader: null };
      setIsLoading(false);
    }
  }, [abortStreaming, cuadroFirmasId, stopTTS, toast]);

  useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      regenerate: async () => {
        if (!open) {
          setOpen(true);
          return;
        }
        await generateSummary();
      },
    }),
    [generateSummary, open],
  );

  const handleCopy = useCallback(async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      toast({
        title: "✅ Copiado",
        description: "El resumen se copió al portapapeles.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo copiar",
        description: "Intenta nuevamente.",
      });
    }
  }, [markdown, toast]);

  const handleDownload = useCallback(() => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `documento-${documentId}-resumen.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "📥 Descargado",
      description: "Resumen guardado como archivo Markdown.",
    });
  }, [documentId, markdown, toast]);

  const summaryContent = useMemo(() => {
    if (markdown) {
      return (
        <ReactMarkdown className="prose prose-base sm:prose-lg max-w-none text-foreground leading-relaxed dark:prose-invert
                                prose-headings:font-semibold prose-headings:text-primary
                                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-7
                                prose-strong:font-bold prose-strong:text-primary
                                prose-ul:list-disc prose-ol:list-decimal prose-li:leading-7
                                prose-li:text-gray-700 dark:prose-li:text-gray-300
                                [&_*]:leading-relaxed">
          {markdown}
        </ReactMarkdown>
      );
    }
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <p className="font-medium text-lg text-foreground">Generando resumen con IA</p>
            <p className="text-sm text-muted-foreground mt-2">
              Analizando el documento y extrayendo información clave...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center text-muted-foreground">
        <Bot className="h-16 w-16 opacity-50" />
        <div>
          <p className="font-medium text-lg">Listo para generar el resumen</p>
          <p className="text-sm mt-1">Haz clic en "Generar Resumen IA" para comenzar</p>
        </div>
      </div>
    );
  }, [isLoading, markdown]);

  useEffect(() => {
    if (open) {
      void generateSummary();
    }
  }, [generateSummary, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        size="xl"
        className="p-0 max-w-none h-[92vh] sm:h-auto overflow-hidden [&_[data-dialog-content]]:h-full sm:[&_[data-dialog-content]]:h-auto [&_[data-dialog-content]]:max-h-[min(calc(100vh-48px),900px)] [&_[data-dialog-content]]:max-w-[1100px] [&_[data-dialog-content]]:w-full [&_[data-dialog-content]]:mx-auto [&_[data-dialog-content]]:p-0"
        aria-describedby={undefined}
        onEscapeKeyDown={() => {
          abortStreaming();
          stopTTS();
        }}
        onInteractOutside={() => {
          abortStreaming();
          stopTTS();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <div className="flex flex-col h-full bg-gradient-to-br from-background to-muted/10">
          {/* Header mejorado */}
          <DialogHeader className="px-4 pt-6 pb-4 sm:px-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-3 text-xl">
                  Resumen IA del Documento
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Inteligencia Artificial
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Genera un resumen inteligente y conversa con la IA sobre el documento
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-hidden">
            {/* Panel de acciones principales */}
            <Card className="border border-blue-200/70 dark:border-blue-800/70 shadow-sm backdrop-blur-sm bg-white/80 dark:bg-slate-950/70">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  {/* Acciones de resumen */}
                  <div className="flex flex-col gap-3 xl:flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button
                        onClick={generateSummary}
                        disabled={isLoading}
                        className="h-11 w-full sm:w-auto px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generar Resumen IA
                          </>
                        )}
                      </Button>

                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={handleCopy}
                          disabled={!markdown || isLoading}
                          className="h-11 w-full sm:w-auto px-4 border-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          disabled={!markdown || isLoading}
                          className="h-11 w-full sm:w-auto px-4 border-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Genera, comparte o descarga el resumen con un solo clic.
                    </p>
                  </div>

                  {/* Control de voz */}
                  <SummaryTTSControls
                    ref={ttsRef}
                    markdown={markdown}
                    variant="compact"
                    className="w-full 2xl:max-w-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabs y contenido */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="grid h-10 w-full grid-cols-2 text-sm bg-muted/40 p-1 rounded-lg">
                <TabsTrigger
                  value="summary"
                  className="h-9 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="h-9 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat del documento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="flex-1 overflow-hidden mt-4">
                <Card className="h-full border border-muted-200/80 dark:border-muted-800/80 shadow-sm bg-card/90">
                  <CardContent className="h-full p-4 sm:p-6 overflow-auto">
                    <div className="space-y-4">
                      {error && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      {summaryContent}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="flex-1 overflow-hidden mt-4">
                <Card className="h-full border border-muted-200/80 dark:border-muted-800/80 shadow-sm bg-card/90">
                  <CardContent className="h-full p-0">
                    <DocChatPanel
                      cuadroFirmasId={cuadroFirmasId}
                      sessionId={sessionId}
                      onRequireSession={ensureSession}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

DocumentSummaryDialog.displayName = "DocumentSummaryDialog";

// Iconos adicionales necesarios
const FileText = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MessageSquare = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);