"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GeneralHeader } from '@/components/general-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Loader2, Sparkles } from 'lucide-react';
import { SignersPanel } from '@/components/document-detail/signers-panel';
import { getDocumentDetail, type DocumentDetail } from '@/services/documentsService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { summarizeDocument, SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { useSession } from '@/lib/session';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { me } = useSession();
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const load = async () => {
    if (!params?.id) return;
    setLoading(true);
    setPdfError(false);
    try {
      const data = await getDocumentDetail(Number(params.id));
      setDetail(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el documento.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params?.id]);

  const handleDownload = () => {
    if (!detail?.urlDocumento) return;
    const a = document.createElement('a');
    a.href = detail.urlDocumento;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleSign = () => {
    toast({ title: 'Firmar', description: 'Funcionalidad no implementada.' });
  };

  const handleReject = () => {
    toast({ title: 'Rechazar', description: 'Funcionalidad no implementada.' });
    setRejectOpen(false);
  };

  const handleSummarize = async () => {
    if (!detail) return;
    setIsSummarizing(true);
    try {
      const text = `Título: ${detail.titulo}\n\nDescripción: ${detail.descripcion ?? ''}`;
      const result = await summarizeDocument({ documentText: text });
      setSummary(result);
    } catch {
      toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudo generar el resumen.' });
    } finally {
      setIsSummarizing(false);
    }
  };

  const currentSigner = detail?.firmantes.find((f) => String(f.id) === String(me?.id));

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <GeneralHeader />
        <main className="flex-1 p-4 md:p-6">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="col-span-8 h-[70vh]" />
            <div className="col-span-4 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col h-screen">
        <GeneralHeader />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">Documento no encontrado.</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <GeneralHeader />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <h1 className="text-2xl font-semibold">{detail.titulo}</h1>
        {detail.descripcion && <p className="text-muted-foreground">{detail.descripcion}</p>}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            {pdfError ? (
              <div className="w-full h-[70vh] rounded-xl bg-muted flex flex-col items-center justify-center">
                <p className="mb-4 text-sm text-muted-foreground">No se pudo cargar el PDF.</p>
                <Button onClick={load}>Reintentar</Button>
              </div>
            ) : (
              <iframe
                src={detail.urlCuadroFirmasPDF}
                className="w-full h-[70vh] rounded-xl bg-muted"
                referrerPolicy="no-referrer"
                onError={() => setPdfError(true)}
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-4 space-y-4">
            <SignersPanel firmantes={detail.firmantes} progress={detail.progress} />
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
            {currentSigner && !currentSigner.estaFirmado && (
              <div className="flex gap-2">
                <Button onClick={handleSign} className="flex-1">Firmar</Button>
                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                  <Button variant="destructive" className="flex-1" onClick={() => setRejectOpen(true)}>
                    Rechazar
                  </Button>
                  <DialogContent aria-describedby="reject-desc">
                    <DialogHeader>
                      <DialogTitle>Motivo del rechazo</DialogTitle>
                      <DialogDescription id="reject-desc">
                        Describa el motivo del rechazo del documento.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    <DialogFooter>
                      <Button variant="secondary" onClick={() => setRejectOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleReject}>Enviar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Resumen con IA</h3>
              </div>
              <Button onClick={handleSummarize} disabled={isSummarizing} className="w-full">
                {isSummarizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSummarizing ? 'Generando...' : 'Resumir Documento'}
              </Button>
              {summary?.summary && (
                <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                  {summary.summary}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
