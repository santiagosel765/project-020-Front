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
    const controller = useRef<AbortController | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const stopTTS = useCallback(() => {
      if (!isSpeechSupported) return;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setSpeechStatus('idle');
    }, [isSpeechSupported]);

    const handlePlay = useCallback(() => {
      if (!isSpeechSupported || !markdown.trim()) return;
      if (speechStatus === 'paused') {
        window.speechSynthesis.resume();
        setSpeechStatus('playing');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(markdown);
      utterance.lang = 'es-GT';
      utterance.onend = () => setSpeechStatus('idle');
      utterance.onpause = () => setSpeechStatus('paused');
      utterance.onresume = () => setSpeechStatus('playing');
      utterance.onerror = () => setSpeechStatus('idle');
      utteranceRef.current = utterance;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setSpeechStatus('playing');
    }, [isSpeechSupported, markdown, speechStatus]);

    const handlePause = useCallback(() => {
      if (!isSpeechSupported || speechStatus !== 'playing') return;
      window.speechSynthesis.pause();
      setSpeechStatus('paused');
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
        <DialogContent className="max-w-6xl w-full">
          <DialogHeader>
            <DialogTitle>Resumen del documento</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="lg:w-1/2 w-full">
              <DocumentPdfViewer pdfUrl={pdfUrl} className="h-[60vh] lg:h-[70vh]" />
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePlay}
                    aria-label={speechStatus === 'paused' ? 'Reanudar lectura en voz alta' : 'Reproducir lectura en voz alta'}
                    disabled={!isSpeechSupported || !markdown.trim()}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePause}
                    aria-label="Pausar lectura en voz alta"
                    disabled={!isSpeechSupported || speechStatus !== 'playing'}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleStop}
                    aria-label="Detener lectura en voz alta"
                    disabled={!isSpeechSupported || speechStatus === 'idle'}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
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
