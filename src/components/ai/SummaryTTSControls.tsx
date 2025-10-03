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
import { Badge } from "@/components/ui/badge";
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
  variant?: "default" | "compact";
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
  ({ markdown, className, variant = "default" }, ref) => {
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
    const isCompact = variant === "compact";

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
      };

      updateVoices();
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      };
    }, [isSupported]);

    useEffect(() => {
      if (!voices.length) {
        setSelectedVoice(null);
        return;
      }

      setSelectedVoice((current) => {
        if (current && voices.some((voice) => voice.voiceURI === current.voiceURI)) {
          return current;
        }
        const stored = loadPreferredVoice(voices);
        return stored ?? voices[0] ?? null;
      });
    }, [voices]);

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

    const voiceIdentifier = useMemo(() => {
      if (!selectedVoice) return "";
      return selectedVoice.voiceURI || selectedVoice.name || "";
    }, [selectedVoice]);

    const voicePlaceholder = !isSupported
      ? "Lectura no disponible"
      : voices.length
      ? "Selecciona voz"
      : "Cargando voces…";

    const selectTriggerClass = cn(
      "min-w-0",
      isCompact ? "h-8 text-sm" : "h-10 text-sm",
      isCompact ? "w-full sm:w-56" : "w-full sm:w-60",
    );

    const iconButtonClass = cn(
      isCompact ? "h-8 w-8" : "h-10 w-10",
      "rounded-full",
    );

    const buttons = (
      <div className="flex items-center gap-2">
        {showPlayButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={status === "paused" ? handleResume : handlePlay}
            disabled={!canStartPlayback}
            className={iconButtonClass}
            aria-label={status === "paused" ? "Reanudar lectura" : "Reproducir resumen"}
            aria-pressed={status === "playing"}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        {showPauseButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePause}
            className={iconButtonClass}
            aria-label="Pausar lectura"
            aria-pressed={status === "paused"}
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {showStopButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleStop}
            className={iconButtonClass}
            aria-label="Detener lectura"
          >
            <Square className="h-4 w-4" />
          </Button>
        )}
      </div>
    );

    const select = (
      <Select
        value={voiceIdentifier || undefined}
        onValueChange={(value) => {
          const fallback = voices[0] ?? null;
          const voice = voices.find((v) => v.voiceURI === value || v.name === value);
          const nextVoice = voice ?? fallback;
          stop();
          setSelectedVoice(nextVoice);
        }}
        disabled={!voices.length || !isSupported}
      >
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder={voicePlaceholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={8}
          avoidCollisions={false}
          className="z-[70]"
        >
          {voices.map((voice) => {
            const id = voice.voiceURI || voice.name;
            return (
              <SelectItem key={id} value={id}>
                {formatVoiceLabel(voice)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );

    if (isCompact) {
      return (
        <div
          className={cn(
            "rounded-lg border p-2 text-sm sm:p-3",
            className,
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-medium text-foreground" title="Lectura IA">
              Lectura IA
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="min-w-0 flex-1 sm:min-w-[8rem]">
                {select}
              </div>
              <Badge
                variant="secondary"
                className="hidden whitespace-nowrap px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:inline-flex"
              >
                {statusLabel}
              </Badge>
            </div>
            <div className="ml-auto">{buttons}</div>
          </div>
          <span className="sr-only" aria-live="polite">
            {statusLabel}
          </span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "rounded-xl border bg-muted/40 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-muted/30 sm:p-4",
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Lectura IA</p>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {statusLabel}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:w-60">{select}</div>
            {buttons}
          </div>
        </div>
      </div>
    );
  },
);

SummaryTTSControls.displayName = "SummaryTTSControls";

export { SummaryTTSControls };
