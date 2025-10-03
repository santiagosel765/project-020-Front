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
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DOCUMENT_SUMMARY_ANALYZE_PATH,
  startDocChat,
} from "@/services/documentsService";

import { DocChatPanel } from "./DocChatPanel";
import { SummaryActions } from "./SummaryActions";
import {
  SummaryTTSControls,
  SummaryTTSControlsHandle,
} from "./SummaryTTSControls";

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
  const ttsRef = useRef<SummaryTTSControlsHandle | null>(null);
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
        title: "Resumen copiado",
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
  }, [documentId, markdown]);

  const summaryContent = useMemo(() => {
    if (markdown) {
      return (
        <ReactMarkdown className="prose prose-sm max-w-none leading-6 dark:prose-invert">
          {markdown}
        </ReactMarkdown>
      );
    }
    if (isLoading) {
      return (
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      );
    }
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        El resumen aparecerá aquí en cuanto esté listo.
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
        className="grid place-items-center p-4 sm:p-6 [&_[data-dialog-content]]:max-h-[90vh] [&_[data-dialog-content]]:w-[min(96vw,560px)] [&_[data-dialog-content]]:gap-4 [&_[data-dialog-content]]:p-4 md:[&_[data-dialog-content]]:w-[min(92vw,900px)] sm:[&_[data-dialog-content]]:gap-5"
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
        <div className="flex max-h-[82vh] flex-col">
          <DialogHeader className="mb-0 space-y-3 p-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <DialogTitle
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg"
                >
                  Resumen IA del Documento
                </DialogTitle>
                <DialogDescription className="sr-only md:not-sr-only md:text-sm md:text-muted-foreground">
                  Genera un resumen inteligente y conversa con la IA sobre el documento.
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="uppercase">
                IA
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
            <SummaryActions
              disabled={!markdown}
              isLoading={isLoading}
              onGenerate={() => void generateSummary()}
              onCopy={() => void handleCopy()}
              onDownload={handleDownload}
              className="md:flex-1"
            />
            <SummaryTTSControls
              ref={ttsRef}
              markdown={markdown}
              variant="compact"
              className="w-full md:max-w-sm"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="pt-2">
              <TabsList className="grid h-9 w-full grid-cols-2 text-sm md:w-auto">
                <TabsTrigger value="summary" className="h-9 text-sm">
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="chat" className="h-9 text-sm">
                  Chat del documento
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="summary" className="flex-1 overflow-hidden">
              <ScrollArea className="max-h-[60vh] md:max-h-[70vh]">
                <div className="space-y-3 px-1 pb-2 pt-4 sm:space-y-4 sm:px-1">
                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando resumen…
                    </div>
                  )}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {summaryContent}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="chat" className="flex-1 overflow-hidden">
              <div className="flex h-full flex-col">
                <DocChatPanel
                  cuadroFirmasId={cuadroFirmasId}
                  sessionId={sessionId}
                  onRequireSession={ensureSession}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
});

DocumentSummaryDialog.displayName = "DocumentSummaryDialog";
