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

const MAX_SEGMENT_CHARS = 300;

const VOICE_STORAGE_KEY = "ttsVoiceId";

const voiceId = (v: SpeechSynthesisVoice) =>
  `${v.name}__${v.lang}__${String(v.localService)}__${v.voiceURI || "no-uri"}`;

const readStoredVoiceId = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

const writeStoredVoiceId = (id: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(VOICE_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(VOICE_STORAGE_KEY);
    }
  } catch (error) {
    // ignore storage errors
  }
};

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

      let attempts = 0;
      let intervalId: number | undefined;

      const applyVoices = () => {
        const available = sortVoices(window.speechSynthesis.getVoices());
        setVoices(available);
        return available.length > 0;
      };

      const handleVoicesChanged = () => {
        applyVoices();
      };

      const hasVoices = applyVoices();
      if (!hasVoices) {
        intervalId = window.setInterval(() => {
          attempts += 1;
          if (applyVoices() || attempts >= 3) {
            if (intervalId) {
              window.clearInterval(intervalId);
            }
          }
        }, 350);
      }

      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        if (intervalId) {
          window.clearInterval(intervalId);
        }
      };
    }, [isSupported]);

    useEffect(() => {
      if (!voices.length) {
        setSelectedVoice(null);
        writeStoredVoiceId(null);
        return;
      }

      setSelectedVoice((current) => {
        if (current && voices.some((voice) => voiceId(voice) === voiceId(current))) {
          return current;
        }

        const storedId = readStoredVoiceId();
        const storedVoice = storedId
          ? voices.find((voice) => voiceId(voice) === storedId)
          : null;
        if (storedVoice) {
          return storedVoice;
        }

        const browserLang = typeof navigator !== "undefined" ? navigator.language : undefined;
        if (browserLang) {
          const locale = browserLang.toLowerCase();
          const exactMatch = voices.find(
            (voice) => (voice.lang || "").toLowerCase() === locale,
          );
          if (exactMatch) {
            return exactMatch;
          }
          const baseLang = locale.split("-")[0];
          const partialMatch = voices.find((voice) =>
            (voice.lang || "").toLowerCase().startsWith(baseLang),
          );
          if (partialMatch) {
            return partialMatch;
          }
        }

        return voices[0] ?? null;
      });
    }, [voices]);

    useEffect(() => {
      if (selectedVoice) {
        writeStoredVoiceId(voiceId(selectedVoice));
      } else {
        writeStoredVoiceId(null);
      }
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

    const selectedVoiceId = useMemo(
      () => (selectedVoice ? voiceId(selectedVoice) : undefined),
      [selectedVoice],
    );

    const voicePlaceholder = !isSupported
      ? "Lectura no disponible"
      : voices.length
      ? "Selecciona voz"
      : "Cargando voces…";

    const iconButtonClass = cn(
      "h-8 w-8 rounded-full",
      !isCompact && "sm:h-10 sm:w-10",
    );

    const controls = (
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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

    const handleVoiceChange = useCallback(
      (value: string) => {
        const nextVoice =
          voices.find((voice) => voiceId(voice) === value) ?? voices[0] ?? null;
        stop();
        setSelectedVoice(nextVoice);
      },
      [stop, voices],
    );

    const select = (
      <Select
        value={selectedVoiceId}
        onValueChange={handleVoiceChange}
        disabled={!voices.length || !isSupported}
      >
        <SelectTrigger
          className={cn(
            "min-w-0 text-sm",
            isCompact ? "h-8 w-full" : "h-10 w-full sm:w-60",
          )}
        >
          <SelectValue placeholder={voicePlaceholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={8}
          collisionPadding={10}
          className="z-[70]"
        >
          {voices.map((voice) => (
            <SelectItem key={voiceId(voice)} value={voiceId(voice)}>
              {formatVoiceLabel(voice)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    if (isCompact) {
      return (
        <div
          className={cn(
            "flex min-h-[40px] items-center gap-2 rounded-lg border bg-background/80 p-2 text-xs sm:text-sm sm:p-3",
            "overflow-visible",
            className,
          )}
        >
          <span className="font-medium uppercase tracking-wide text-muted-foreground">
            Lectura IA
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 sm:min-w-[12rem]">
              <div className="w-[60%] min-w-[8rem] sm:w-auto">
                {select}
              </div>
            </div>
            {controls}
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
            <div className="min-w-0 sm:w-60">{select}</div>
            {controls}
          </div>
        </div>
      </div>
    );
  },
);

SummaryTTSControls.displayName = "SummaryTTSControls";

export { SummaryTTSControls };
