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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      setTimeout(() => {
        titleRef.current?.focus();
      }, 0);
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
    setSessionId(null);
    sessionPromiseRef.current = null;
  }, [cuadroFirmasId]);

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
        setOpen(true);
        await generateSummary();
      },
    }),
    [generateSummary],
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
        <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
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
        Genera un resumen para visualizarlo aquí.
      </div>
    );
  }, [isLoading, markdown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[95vw] gap-0 p-0 md:max-w-[min(98vw,1200px)]"
        onEscapeKeyDown={() => {
          abortStreaming();
          stopTTS();
        }}
        onInteractOutside={() => {
          abortStreaming();
          stopTTS();
        }}
      >
        <div className="flex h-[90dvh] flex-col md:h-[85dvh]">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Resumen IA del Documento
                </DialogTitle>
                <p className="sr-only">
                  Genera un resumen inteligente y conversa con la IA sobre el documento.
                </p>
              </div>
              <Badge variant="secondary" className="uppercase">
                IA
              </Badge>
            </div>
          </DialogHeader>

          <div className="sticky top-0 z-20 border-y bg-background/95 px-6 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SummaryActions
                disabled={!markdown}
                isLoading={isLoading}
                onGenerate={() => void generateSummary()}
                onCopy={() => void handleCopy()}
                onDownload={handleDownload}
              />
              <SummaryTTSControls
                ref={ttsRef}
                markdown={markdown}
                className="flex flex-1 justify-start md:justify-end"
              />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2 md:w-auto">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="chat">Chat del documento</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="summary"
              className="flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full px-6 pb-6">
                <div className="flex flex-col gap-4 py-4">
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
