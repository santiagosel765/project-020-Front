"use client";

import {
  Pause,
  Play,
  Square,
  Volume2,
} from "lucide-react";
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

    const sanitizedMarkdown = useMemo(() => sanitizeMarkdown(markdown), [markdown]);

    const stop = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      queueRef.current = [];
      currentIndexRef.current = 0;
      setStatus("idle");
    }, [isSupported]);

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

    const speakNext = useCallback(() => {
      if (!isSupported || !selectedVoice) return;
      const segments = queueRef.current;
      if (currentIndexRef.current >= segments.length) {
        stop();
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
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setStatus("playing");
    }, [isSupported, selectedVoice, stop, toast]);

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
      setStatus("paused");
    }, [isSupported]);

    const handleResume = useCallback(() => {
      if (!isSupported) return;
      window.speechSynthesis.resume();
      setStatus("playing");
    }, [isSupported]);

    const handleStop = useCallback(() => {
      stop();
    }, [stop]);

    const disablePlay = !sanitizedMarkdown || status !== "idle" || !selectedVoice;

    return (
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Select
              value={selectedVoice?.voiceURI || selectedVoice?.name || ""}
              onValueChange={(value) => {
                const voice = voices.find(
                  (v) => v.voiceURI === value || v.name === value,
                );
                setSelectedVoice(voice ?? null);
                stop();
              }}
              disabled={!voices.length}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecciona voz" />
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
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlay}
              disabled={disablePlay}
            >
              <Play className="mr-1 h-4 w-4" />
              Reproducir
            </Button>
            {status === "playing" ? (
              <Button size="sm" variant="outline" onClick={handlePause}>
                <Pause className="mr-1 h-4 w-4" />
                Pausa
              </Button>
            ) : status === "paused" ? (
              <Button size="sm" variant="outline" onClick={handleResume}>
                <Play className="mr-1 h-4 w-4" />
                Reanudar
              </Button>
            ) : null}
            {(status === "playing" || status === "paused") && (
              <Button size="sm" variant="outline" onClick={handleStop}>
                <Square className="mr-1 h-4 w-4" />
                Detener
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

SummaryTTSControls.displayName = "SummaryTTSControls";

export { SummaryTTSControls };
