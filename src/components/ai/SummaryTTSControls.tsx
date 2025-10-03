"use client";

import { Volume2, Play, Pause, Square, Bot } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

function formatVoiceLabel(voice: SpeechSynthesisVoice) {
  const rawName = voice.name || voice.voiceURI || "";
  const cleanedName = rawName
    .replace(/\b(Microsoft|Google|Amazon|Apple|Online|Neural|Natural|Standard|Voice)\b/gi, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const simplifiedName = cleanedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  const langTag = (voice.lang || "").replace(/_/g, "-").toUpperCase();

  const label = simplifiedName || rawName || langTag || "Voz";

  return langTag ? `${label} (${langTag})` : label;
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
        const allVoices = window.speechSynthesis.getVoices();
        const spanishVoices = allVoices
          .filter((voice) => voice.lang.toLowerCase().startsWith('es'))
          .sort((a, b) => {
            // Prefer Mexican Spanish voices
            if (a.lang.includes('MX') && !b.lang.includes('MX')) return -1;
            if (!a.lang.includes('MX') && b.lang.includes('MX')) return 1;
            return a.name.localeCompare(b.name);
          });
        setVoices(spanishVoices);
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
        
        // Try to load preferred voice from localStorage
        try {
          const savedVoiceURI = localStorage.getItem('ttsVoiceURI');
          if (savedVoiceURI) {
            const savedVoice = voices.find(voice => 
              voice.voiceURI === savedVoiceURI || voice.name === savedVoiceURI
            );
            if (savedVoice) return savedVoice;
          }
        } catch (error) {
          // Ignore localStorage errors
        }
        
        return voices[0] ?? null;
      });
    }, [voices]);

    useEffect(() => {
      if (!selectedVoice) return;
      
      try {
        const identifier = selectedVoice.voiceURI || selectedVoice.name || '';
        if (identifier) {
          localStorage.setItem('ttsVoiceURI', identifier);
        }
      } catch (error) {
        // Ignore localStorage errors
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
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
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
          title: "Lectura de voz no disponible",
          description: "Tu navegador no soporta la función de lectura en voz alta.",
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
          description: "Elige una voz para usar la lectura en voz alta.",
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
      : "Listo para leer";

    const showPlayButton = status === "idle" || status === "paused";
    const showPauseButton = status === "playing";
    const showStopButton = status === "playing" || status === "paused";
    const canStartPlayback = Boolean(sanitizedMarkdown && selectedVoice && isSupported);

    const voiceIdentifier = useMemo(() => {
      if (!selectedVoice) return "";
      return selectedVoice.voiceURI || selectedVoice.name || "";
    }, [selectedVoice]);

    const voicePlaceholder = !isSupported
      ? "Lectura no disponible"
      : voices.length
      ? "Selecciona una voz"
      : "Cargando voces…";

    const isCompact = variant === "compact";

    return (
      <Card
        className={cn(
          "w-full bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm border border-purple-200/70 dark:border-purple-800/60 shadow-sm",
          className,
        )}
      >
        <CardContent className={cn("p-4", isCompact ? "sm:p-4" : "sm:p-5") }>
          <div
            className={cn(
              "flex w-full flex-col gap-4",
              isCompact
                ? "md:flex-row md:items-start md:justify-between xl:items-center"
                : "sm:flex-row sm:items-center sm:justify-between"
            )}
          >
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100/80 dark:bg-purple-900/70">
                <Volume2 className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">
                  ¿Escuchar resumen?
                </p>
                <Badge
                  variant="secondary"
                  className="mt-1 bg-purple-100/80 text-purple-700 border-purple-200 text-xs"
                >
                  {statusLabel}
                </Badge>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 min-w-0 flex flex-col gap-3",
                isCompact ? "sm:flex-col lg:flex-row lg:items-center" : "sm:flex-row sm:items-center"
              )}
            >
              <Select
                value={voiceIdentifier || undefined}
                onValueChange={(value) => {
                  const voice = voices.find((v) => v.voiceURI === value || v.name === value);
                  const nextVoice = voice ?? voices[0] ?? null;
                  stop();
                  setSelectedVoice(nextVoice);
                }}
                disabled={!voices.length || !isSupported}
              >
                <SelectTrigger className="h-10 w-full min-w-0 border border-purple-200 bg-white px-3 text-sm font-medium text-purple-900 shadow-sm transition-colors hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:bg-gray-800 dark:text-purple-100 dark:border-purple-700">
                  <SelectValue placeholder={voicePlaceholder} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={8}
                  className="z-[100] max-h-[300px] w-[var(--radix-select-trigger-width)]"
                  avoidCollisions={false}
                >
                  {voices.map((voice) => {
                    const id = voice.voiceURI || voice.name;
                    const label = formatVoiceLabel(voice);
                    return (
                      <SelectItem key={id} value={id} className="text-sm">
                        🗣️ {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <div
                className={cn(
                  "flex gap-2",
                  isCompact ? "justify-start" : "justify-center sm:justify-end",
                  "w-full sm:w-auto"
                )}
              >
                {showPlayButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
                    onClick={status === "paused" ? handleResume : handlePlay}
                    disabled={!canStartPlayback}
                    aria-label={status === "paused" ? "Reanudar lectura" : "Reproducir resumen"}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                
                {showPauseButton && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all"
                    onClick={handlePause}
                    aria-label="Pausar lectura"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                
                {showStopButton && (
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all"
                    onClick={handleStop}
                    aria-label="Detener lectura"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

SummaryTTSControls.displayName = "SummaryTTSControls";

export { SummaryTTSControls };