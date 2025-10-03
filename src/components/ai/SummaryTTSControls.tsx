"use client";

import { Bot, Pause, Play, Square } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  formatVoiceLabel,
  loadPreferredVoice,
  savePreferredVoice,
  sortVoices,
} from "@/utils/voiceLabels";

export interface SummaryTTSControlsProps {
  markdown: string;
  className?: string;
}

export interface SummaryTTSControlsHandle {
  stop: () => void;
}

type TTSStatus = "idle" | "playing" | "paused";

const MAX_SEGMENT_CHARS = 200;

function sanitizeMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]*\)/g, "$1")
    .replace(/>+/g, " ")
    .replace(/#+\s*/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function splitIntoSegments(text: string) {
  if (!text) return [] as string[];
  const rawParts = text
    .split(/\n{2,}/)
    .flatMap((paragraph) => paragraph.split(/(?<=\.)\s+/))
    .map((part) => part.trim())
    .filter(Boolean);

  const segments: string[] = [];

  rawParts.forEach((part) => {
    let remaining = part;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_SEGMENT_CHARS) {
        segments.push(remaining.trim());
        break;
      }
      let sliceIndex = remaining.lastIndexOf(" ", MAX_SEGMENT_CHARS);
      if (sliceIndex <= 0) {
        sliceIndex = MAX_SEGMENT_CHARS;
      }
      const chunk = remaining.slice(0, sliceIndex).trim();
      if (chunk) {
        segments.push(chunk);
      }
      remaining = remaining.slice(sliceIndex).trim();
    }
  });

  return segments;
}

const SummaryTTSControls = forwardRef<SummaryTTSControlsHandle, SummaryTTSControlsProps>(
  ({ markdown, className }, ref) => {
    const { toast } = useToast();
    const [status, setStatus] = useState<TTSStatus>("idle");
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const queueRef = useRef<string[]>([]);
    const currentIndexRef = useRef(0);
    const isClient = typeof window !== "undefined";
    const isSupported = isClient && "speechSynthesis" in window;
    const statusRef = useRef<TTSStatus>("idle");

    const sanitizedMarkdown = useMemo(() => sanitizeMarkdown(markdown), [markdown]);

    const clearQueue = useCallback(() => {
      queueRef.current = [];
      currentIndexRef.current = 0;
      utteranceRef.current = null;
    }, []);

    const updateStatus = useCallback((next: TTSStatus) => {
      statusRef.current = next;
      setStatus(next);
    }, []);

    const stop = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      clearQueue();
      updateStatus("idle");
    }, [clearQueue, isSupported, updateStatus]);

    useImperativeHandle(ref, () => ({ stop }), [stop]);

    useEffect(() => {
      if (!isSupported) return;

      const updateVoices = () => {
        const available = sortVoices(window.speechSynthesis.getVoices());
        setVoices(available);
        setSelectedVoice((current) => {
          if (current && available.some((voice) => voice.voiceURI === current.voiceURI)) {
            return current;
          }
          const stored = loadPreferredVoice(available);
          return stored ?? available[0] ?? null;
        });
      };

      updateVoices();
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      };
    }, [isSupported]);

    useEffect(() => {
      if (!selectedVoice) return;
      savePreferredVoice(selectedVoice);
    }, [selectedVoice]);

    useEffect(() => {
      return () => {
        stop();
      };
    }, [stop]);

    const finishPlayback = useCallback(() => {
      clearQueue();
      updateStatus("idle");
    }, [clearQueue, updateStatus]);

    const speakNext = useCallback(() => {
      if (!isSupported || !selectedVoice) return;
      const segments = queueRef.current;
      if (currentIndexRef.current >= segments.length) {
        finishPlayback();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segments[currentIndexRef.current]);
      utterance.voice = selectedVoice;
      utterance.onend = () => {
        currentIndexRef.current += 1;
        speakNext();
      };
      utterance.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error de voz",
          description: "No se pudo reproducir el audio.",
        });
        stop();
      };
      utterance.onstart = () => {
        updateStatus("playing");
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, [finishPlayback, isSupported, selectedVoice, stop, toast, updateStatus]);

    const handlePlay = useCallback(() => {
      if (!isSupported) {
        toast({
          variant: "destructive",
          title: "TTS no disponible",
          description: "El navegador no soporta lectura en voz.",
        });
        return;
      }
      if (!sanitizedMarkdown) {
        toast({
          title: "Sin contenido",
          description: "Genera el resumen antes de reproducir.",
        });
        return;
      }
      if (!selectedVoice) {
        toast({
          title: "Selecciona una voz",
          description: "Elige una voz para usar lectura en voz alta.",
        });
        return;
      }

      stop();
      queueRef.current = splitIntoSegments(sanitizedMarkdown);
      currentIndexRef.current = 0;
      if (!queueRef.current.length) {
        toast({
          title: "Sin contenido",
          description: "No hay texto disponible para leer.",
        });
        return;
      }
      speakNext();
    }, [isSupported, sanitizedMarkdown, selectedVoice, speakNext, stop, toast]);

    const handlePause = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.pause();
      updateStatus("paused");
    }, [isSupported, updateStatus]);

    const handleResume = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.resume();
      updateStatus("playing");
    }, [isSupported, updateStatus]);

    const handleStop = useCallback(() => {
      stop();
    }, [stop]);

    const statusLabel = !isSupported
      ? "Lectura no disponible"
      : status === "playing"
      ? "Leyendo…"
      : status === "paused"
      ? "Pausado"
      : "Listo";

    const showPlayButton = status === "idle" || status === "paused";
    const showPauseButton = status === "playing";
    const showStopButton = status === "playing" || status === "paused";
    const canStartPlayback = Boolean(
      sanitizedMarkdown && selectedVoice && isSupported,
    );

    const voiceValue = selectedVoice?.voiceURI || selectedVoice?.name || "";

    const voicePlaceholder = !isSupported
      ? "Lectura no disponible"
      : voices.length
      ? "Selecciona voz"
      : "Cargando voces…";

    return (
      <div
        className={cn(
          "rounded-2xl border bg-muted/40 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/30",
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lectura IA
              </span>
              <span aria-live="polite" className="text-sm font-semibold text-foreground">
                {statusLabel}
              </span>
              {status === "playing" && (
                <div className="mt-1 flex h-4 items-end gap-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <span
                      key={index}
                      className="w-1.5 rounded-full bg-primary/80 animate-pulse"
                      style={{
                        animationDelay: `${index * 120}ms`,
                        height: `${0.55 + index * 0.3}rem`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Select
              value={voiceValue}
              onValueChange={(value) => {
                const voice = voices.find(
                  (v) => v.voiceURI === value || v.name === value,
                );
                setSelectedVoice(voice ?? null);
                stop();
              }}
              disabled={!voices.length || !isSupported}
            >
              <SelectTrigger className="h-11 w-full rounded-full border-muted sm:h-10 sm:w-[160px]">
                <SelectValue placeholder={voicePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => {
                  const id = voice.voiceURI || voice.name;
                  return (
                    <SelectItem key={id} value={voice.voiceURI || voice.name}>
                      {formatVoiceLabel(voice)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              {showPlayButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={status === "paused" ? handleResume : handlePlay}
                  disabled={!canStartPlayback}
                  className="h-11 w-11 rounded-full sm:h-10 sm:w-10"
                  aria-label={status === "paused" ? "Reanudar lectura" : "Reproducir resumen"}
                >
                  <Play className="h-5 w-5" />
                </Button>
              )}
              {showPauseButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePause}
                  className="h-11 w-11 rounded-full sm:h-10 sm:w-10"
                  aria-label="Pausar lectura"
                >
                  <Pause className="h-5 w-5" />
                </Button>
              )}
              {showStopButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleStop}
                  className="h-11 w-11 rounded-full sm:h-10 sm:w-10"
                  aria-label="Detener lectura"
                >
                  <Square className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SummaryTTSControls.displayName = "SummaryTTSControls";

export { SummaryTTSControls };
