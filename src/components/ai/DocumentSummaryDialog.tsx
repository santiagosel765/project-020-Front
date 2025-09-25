"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Copy, Download, Play, Pause, Square } from 'lucide-react';

import { DocumentPdfViewer } from '@/components/document-detail/pdf-viewer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CuadroFirmaDetalle } from '@/services/documentsService';

export interface DocumentSummaryDialogProps {
  documentId: number;
  cuadroFirmasId: number;
  docData: CuadroFirmaDetalle | null;
}

export interface DocumentSummaryDialogHandle {
  open: () => void;
  close: () => void;
  regenerate: () => Promise<void>;
}

export const DocumentSummaryDialog = forwardRef<DocumentSummaryDialogHandle, DocumentSummaryDialogProps>(
  ({ documentId, cuadroFirmasId, docData }, ref) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [markdown, setMarkdown] = useState('');
    const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const controller = useRef<AbortController | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const speakingRef = useRef(false);
    const pausedRef = useRef(false);
    const speakTimeoutRef = useRef<number | null>(null);

    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const stopTTS = useCallback(() => {
      if (!isSpeechSupported) return;
      if (speakTimeoutRef.current !== null) {
        window.clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      speakingRef.current = false;
      pausedRef.current = false;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setSpeechStatus('idle');
    }, [isSpeechSupported]);

    useEffect(() => {
      if (!isSpeechSupported) return;

      const preferenceOrder = ['es-gt', 'es-mx', 'es-us', 'es-es'];

      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        const spanishVoices = allVoices
          .filter((voice) => voice.lang?.toLowerCase().startsWith('es'))
          .sort((a, b) => {
            const langA = a.lang?.toLowerCase() ?? '';
            const langB = b.lang?.toLowerCase() ?? '';
            const priorityA = preferenceOrder.findIndex((pref) => langA.startsWith(pref));
            const priorityB = preferenceOrder.findIndex((pref) => langB.startsWith(pref));
            const safePriorityA = priorityA === -1 ? preferenceOrder.length : priorityA;
            const safePriorityB = priorityB === -1 ? preferenceOrder.length : priorityB;
            if (safePriorityA !== safePriorityB) {
              return safePriorityA - safePriorityB;
            }
            return a.name.localeCompare(b.name);
          });

        setVoices(spanishVoices);

        setSelectedVoice((current) => {
          if (current && spanishVoices.some((voice) => voice.voiceURI === current.voiceURI)) {
            return current;
          }

          let savedVoiceURI: string | null = null;
          try {
            savedVoiceURI = localStorage.getItem('ttsVoiceURI');
          } catch (error) {
            savedVoiceURI = null;
          }

          const savedVoice = savedVoiceURI
            ? spanishVoices.find((voice) => voice.voiceURI === savedVoiceURI)
            : undefined;

          if (savedVoice) {
            return savedVoice;
          }

          return spanishVoices[0] ?? null;
        });
      };

      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }, [isSpeechSupported]);

    useEffect(() => {
      if (typeof window === 'undefined' || !selectedVoice) return;
      try {
        localStorage.setItem('ttsVoiceURI', selectedVoice.voiceURI);
      } catch (error) {
        // ignore write errors
      }
    }, [selectedVoice]);

    const speakMarkdown = useCallback(
      (md: string) => {
        if (!isSpeechSupported || !selectedVoice) return;

        if (speakTimeoutRef.current !== null) {
          window.clearTimeout(speakTimeoutRef.current);
          speakTimeoutRef.current = null;
        }

        window.speechSynthesis.cancel();
        speakingRef.current = true;
        pausedRef.current = false;

        const sanitized = md
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/`[^`]*`/g, ' ')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/__(.*?)__/g, '$1')
          .replace(/_(.*?)_/g, '$1')
          .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/>+/g, ' ')
          .replace(/#+\s*/g, '')
          .replace(/[-*]\s+/g, '')
          .replace(/\r/g, '')
          .split('\n')
          .map((line) => line.trim())
          .join('\n')
          .replace(/[ \t]{2,}/g, ' ')
          .trim();

        if (!sanitized) {
          speakingRef.current = false;
          setSpeechStatus('idle');
          return;
        }

        const rawParts = sanitized
          .split(/\n{2,}/)
          .flatMap((paragraph) => paragraph.split(/(?<=\.)\s+/))
          .map((part) => part.trim())
          .filter(Boolean);

        const MAX_CHARS = 200;
        const parts: string[] = [];

        rawParts.forEach((part) => {
          let remaining = part;
          while (remaining.length > 0) {
            if (remaining.length <= MAX_CHARS) {
              parts.push(remaining.trim());
              break;
            }
            let sliceIndex = remaining.lastIndexOf(' ', MAX_CHARS);
            if (sliceIndex <= 0) {
              sliceIndex = MAX_CHARS;
            }
            const chunk = remaining.slice(0, sliceIndex).trim();
            if (chunk) {
              parts.push(chunk);
            }
            remaining = remaining.slice(sliceIndex).trim();
          }
        });

        if (!parts.length) {
          speakingRef.current = false;
          setSpeechStatus('idle');
          return;
        }

        let index = 0;

        const speakNext = () => {
          if (!speakingRef.current || index >= parts.length) {
            speakingRef.current = false;
            pausedRef.current = false;
            utteranceRef.current = null;
            setSpeechStatus('idle');
            return;
          }

          const utterance = new SpeechSynthesisUtterance(parts[index]);
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
          utterance.rate = 1.05;
          utterance.pitch = 1.05;
          utterance.volume = 1;
          utterance.onend = () => {
            if (!speakingRef.current) return;
            index += 1;
            if (index >= parts.length) {
              speakingRef.current = false;
              pausedRef.current = false;
              utteranceRef.current = null;
              setSpeechStatus('idle');
              return;
            }
            speakTimeoutRef.current = window.setTimeout(() => {
              speakTimeoutRef.current = null;
              if (speakingRef.current) {
                speakNext();
              }
            }, 300);
          };
          utterance.onerror = () => {
            speakingRef.current = false;
            pausedRef.current = false;
            utteranceRef.current = null;
            setSpeechStatus('idle');
          };
          utterance.onpause = () => {
            pausedRef.current = true;
            setSpeechStatus('paused');
          };
          utterance.onresume = () => {
            pausedRef.current = false;
            setSpeechStatus('playing');
          };

          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
          setSpeechStatus('playing');
        };

        speakNext();
      },
      [isSpeechSupported, selectedVoice],
    );

    const handleVoiceChange = useCallback(
      (voiceURI: string) => {
        const nextVoice = voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
        if (!nextVoice) return;
        setSelectedVoice(nextVoice);
        try {
          localStorage.setItem('ttsVoiceURI', nextVoice.voiceURI);
        } catch (error) {
          // ignore write errors
        }
        stopTTS();
      },
      [stopTTS, voices],
    );

    const handlePlay = useCallback(() => {
      if (!isSpeechSupported || !markdown.trim() || !selectedVoice || speechStatus !== 'idle') return;
      stopTTS();
      speakMarkdown(markdown);
    }, [isSpeechSupported, markdown, selectedVoice, speakMarkdown, speechStatus, stopTTS]);

    const handlePause = useCallback(() => {
      if (!isSpeechSupported || speechStatus !== 'playing') return;
      window.speechSynthesis.pause();
      pausedRef.current = true;
      setSpeechStatus('paused');
    }, [isSpeechSupported, speechStatus]);

    const handleResume = useCallback(() => {
      if (!isSpeechSupported || speechStatus !== 'paused') return;
      window.speechSynthesis.resume();
      pausedRef.current = false;
      setSpeechStatus('playing');
    }, [isSpeechSupported, speechStatus]);

    const handleStop = useCallback(() => {
      stopTTS();
    }, [stopTTS]);

    const copyToClipboard = useCallback(async () => {
      if (!markdown.trim()) return;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(markdown);
          toast({ title: 'Copiado', description: 'Resumen copiado al portapapeles.' });
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar el resumen.' });
      }
    }, [markdown, toast]);

    const downloadMarkdown = useCallback(() => {
      if (!markdown.trim()) return;
      try {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumen_${documentId}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo descargar el resumen.' });
      }
    }, [documentId, markdown, toast]);

    const generateSummary = useCallback(async () => {
      setError(null);
      setMarkdown('');
      setIsLoading(true);
      stopTTS();
      controller.current?.abort();
      const abortController = new AbortController();
      controller.current = abortController;

      try {
        const response = await fetch(`/api/documents/analyze-pdf/${cuadroFirmasId}`, {
          method: 'POST',
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('No se pudo generar el resumen');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            setMarkdown((prev) => prev + chunk);
          }
        }

        const remainder = decoder.decode();
        if (remainder) {
          setMarkdown((prev) => prev + remainder);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error(err);
        setError('No se pudo generar el resumen');
      } finally {
        setIsLoading(false);
        controller.current = null;
      }
    }, [cuadroFirmasId, stopTTS]);

    const handleOpenChange = useCallback(
      (open: boolean) => {
        setIsOpen(open);
        if (!open) {
          controller.current?.abort();
          controller.current = null;
          stopTTS();
        }
      },
      [stopTTS],
    );

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setIsOpen(true);
        },
        close: () => {
          setIsOpen(false);
        },
        regenerate: () => generateSummary(),
      }),
      [generateSummary],
    );

    useEffect(() => {
      if (isOpen) {
        void generateSummary();
      }
    }, [generateSummary, isOpen]);

    useEffect(() => {
      return () => {
        controller.current?.abort();
        controller.current = null;
        stopTTS();
      };
    }, [stopTTS]);

    const pdfUrl = docData?.urlDocumento ?? docData?.urlCuadroFirmasPDF ?? '';

    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resumen del documento</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="w-full max-h-[min(100dvh-32px,700px)] overflow-auto overscroll-y-contain touch-pan-y lg:w-1/2">
              <DocumentPdfViewer pdfUrl={pdfUrl} className="min-h-[60vh]" />
            </div>
            <div className="lg:w-1/2 w-full flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button onClick={generateSummary} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Generando…' : 'Generar'}
                </Button>
                <Button variant="outline" onClick={copyToClipboard} disabled={!markdown.trim()}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                <Button variant="outline" onClick={downloadMarkdown} disabled={!markdown.trim()}>
                  <Download className="mr-2 h-4 w-4" /> Descargar .md
                </Button>
                {isSpeechSupported ? (
                  <div className="flex items-center gap-2">
                      {voices.length > 1 && (
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value={selectedVoice?.voiceURI ?? ''}
                          onChange={(event) => handleVoiceChange(event.target.value)}
                          aria-label="Seleccionar voz para lectura"
                        >
                          {voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name || voice.voiceURI}
                            </option>
                          ))}
                        </select>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePlay}
                        aria-label="Reproducir lectura en voz alta"
                        disabled={!markdown.trim() || !selectedVoice || speechStatus !== 'idle'}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      {speechStatus === 'playing' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePause}
                          aria-label="Pausar lectura en voz alta"
                          disabled={speechStatus !== 'playing'}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {speechStatus === 'paused' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleResume}
                          aria-label="Reanudar lectura en voz alta"
                          disabled={speechStatus !== 'paused'}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleStop}
                        aria-label="Detener lectura en voz alta"
                        disabled={speechStatus === 'idle'}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-not-allowed items-center gap-2">
                          <select
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                            value=""
                            disabled
                            aria-label="Seleccionar voz para lectura"
                          >
                            <option>Sin voces disponibles</option>
                          </select>
                          <Button variant="outline" size="icon" disabled>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" disabled>
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" disabled>
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Lectura no soportada en este navegador</TooltipContent>
                    </Tooltip>
                  )}
              </div>
              <div className="flex-1 rounded-lg border bg-background">
                <ScrollArea className="h-[24rem] lg:h-[60vh]" role="document" aria-live="polite">
                  {markdown.trim() ? (
                    <div className="p-4">
                      <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">{markdown}</ReactMarkdown>
                    </div>
                  ) : isLoading ? (
                    <div className="flex min-h-[16rem] items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generando resumen…
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">Genera el resumen para visualizarlo aquí.</p>
                  )}
                </ScrollArea>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

DocumentSummaryDialog.displayName = 'DocumentSummaryDialog';
