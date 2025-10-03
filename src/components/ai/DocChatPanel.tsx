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
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
          <div className="flex flex-col gap-4 p-4 text-sm">
            {messages.length === 0 ? (
              <p className="text-muted-foreground">
                Inicia una conversación para consultar detalles del documento.
              </p>
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
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-full rounded-lg px-3 py-2", 
                      message.role === "assistant"
                        ? "bg-muted text-left"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                        {message.content || (message.isStreaming ? "IA está escribiendo…" : "")}
                      </ReactMarkdown>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.isStreaming && message.role === "assistant" && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
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
        className="space-y-3 border-t bg-background/95 p-4"
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
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {input.length}/{MAX_INPUT_CHARS}
          </span>
          <Button type="submit" disabled={!input.trim() || isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSending ? "IA está escribiendo…" : "Enviar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
