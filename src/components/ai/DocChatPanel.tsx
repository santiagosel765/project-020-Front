"use client";

import { Bot, Loader2, Send } from "lucide-react";
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sendDocChatMessage } from "@/services/documentsService";

const MAX_INPUT_CHARS = 2000;

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
};

export interface DocChatPanelProps {
  cuadroFirmasId: number;
  sessionId: string | null;
  onRequireSession: () => Promise<string>;
}

const isReadableStream = (
  value: unknown,
): value is ReadableStream<Uint8Array> => {
  return (
    typeof ReadableStream !== "undefined" &&
    value instanceof ReadableStream &&
    typeof value.getReader === "function"
  );
};

export function DocChatPanel({
  sessionId,
  onRequireSession,
}: DocChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement | null;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
  }, []);

  const parseStreamChunk = useCallback((rawChunk: string) => {
    return rawChunk
      .split(/\n/)
      .map((line) => line.replace(/^data:\s*/i, ""))
      .filter((line) => line && line !== "[DONE]")
      .join("\n");
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setMessages([]);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      void onRequireSession().catch(() => undefined);
    }
  }, [onRequireSession, sessionId]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    return onRequireSession();
  }, [onRequireSession, sessionId]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const idBase = Date.now().toString(36);
    const userMessage: Message = {
      id: `user-${idBase}`,
      role: "user",
      content: trimmed,
    };
    const assistantMessage: Message = {
      id: `assistant-${idBase}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsSending(true);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const sid = await ensureSession();
      const response = await sendDocChatMessage(sid, trimmed, {
        signal: controller.signal,
        stream: true,
      });

      if (isReadableStream(response)) {
        const reader = response.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            const parsed = parseStreamChunk(chunk);
            if (!parsed) {
              continue;
            }
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      content: `${message.content}${parsed}`,
                    }
                  : message,
              ),
            );
          }
        }
      } else if (response && typeof (response as any).content === "string") {
        const content = (response as { content: string }).content;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content,
                }
              : message,
          ),
        );
      } else {
        throw new Error("Respuesta inesperada del servidor");
      }
    } catch (error: any) {
      if (controller.signal.aborted) {
        return;
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: "No se pudo obtener respuesta.",
                isStreaming: false,
              }
            : message,
        ),
      );
      toast({
        variant: "destructive",
        title: "Error en el chat",
        description: error?.message || "Intenta nuevamente.",
      });
    } finally {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                isStreaming: false,
              }
            : message,
        ),
      );
      setIsSending(false);
      abortRef.current = null;
    }
  }, [ensureSession, input, isSending, parseStreamChunk, toast]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSend();
    },
    [handleSend],
  );

  const placeholder = useMemo(
    () =>
      "Haz preguntas sobre el documento. Usa Shift+Enter para salto de línea.",
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-muted-200/70 bg-muted/30 px-4 py-3 dark:border-muted-800/70 dark:bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Chat del documento</p>
            <p className="text-xs text-muted-foreground">
              Conversa con la IA sobre secciones específicas del archivo.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
          <div className="flex flex-col gap-4 p-4 text-sm">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-muted-200 bg-muted/20 px-4 py-6 text-center text-muted-foreground dark:border-muted-800 dark:bg-muted/10">
                Inicia una conversación para consultar detalles del documento.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      message.role === "assistant"
                        ? "bg-background border border-muted-200 text-left dark:border-muted-800"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                        {message.content || (message.isStreaming ? "IA está escribiendo…" : "")}
                      </ReactMarkdown>
                    ) : (
                      <p className="font-medium">{message.content}</p>
                    )}
                    {message.isStreaming && message.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>IA está escribiendo…</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-t border-muted-200/70 bg-background/95 p-4 backdrop-blur-sm dark:border-muted-800/70"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            const value = event.target.value;
            setInput(value.length > MAX_INPUT_CHARS ? value.slice(0, MAX_INPUT_CHARS) : value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={3}
          placeholder={placeholder}
          className="resize-none border border-muted-200/80 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-muted-800"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {input.length}/{MAX_INPUT_CHARS}
          </span>
          <Button
            type="submit"
            disabled={!input.trim() || isSending}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending ? "IA está escribiendo…" : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
