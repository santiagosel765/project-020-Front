"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { GeneralHeader } from '@/components/general-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Sparkles } from 'lucide-react';
import { SignersPanel } from '@/components/document-detail/signers-panel';
import {
  getCuadroFirmaDetalle,
  getFirmantes,
  type CuadroFirmaDetalle,
  type SignerFull,
  type Signer,
} from '@/services/documentsService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/store/auth';
import { fullName, initials } from '@/lib/avatar';
import { SignDialog } from '@/components/sign-dialog';
import {
  DocumentSummaryDialog,
  type DocumentSummaryDialogHandle,
} from '@/components/ai/DocumentSummaryDialog';
import { DocumentPdfViewer } from '@/components/document-detail/pdf-viewer';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [detalle, setDetalle] = useState<CuadroFirmaDetalle | null>(null);
  const [firmantes, setFirmantes] = useState<SignerFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const summaryDialogRef = useRef<DocumentSummaryDialogHandle>(null);

  const fetchDetalle = async (id: number) => {
    setLoading(true);
    setPdfError(false);
    try {
      const det = await getCuadroFirmaDetalle(id, 3600);
      const fs = await getFirmantes(id);
      const mapped: SignerFull[] = fs.map((f) => {
        const foto = f.user.urlFoto ?? f.user.url_foto ?? f.user.avatar ?? null;
        return {
          user: {
            id: Number(f.user.id),
            nombre: fullName(f.user),
            posicion: f.user.posicion?.nombre ?? undefined,
            gerencia: f.user.gerencia?.nombre ?? undefined,
            urlFoto: foto ?? undefined,
            avatar: foto ?? undefined,
          },
        responsabilidad: {
          id: Number(f.responsabilidad_firma.id),
          nombre: f.responsabilidad_firma.nombre,
        },
        estaFirmado: f.estaFirmado,
        } satisfies SignerFull;
      });
      setDetalle(det);
      setFirmantes(mapped);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el documento.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchDetalle(Number(params.id));
  }, [params?.id]);

  const handleDownload = () => {
    if (!detalle?.urlDocumento) return;
    const a = document.createElement('a');
    a.href = detalle.urlDocumento;
    a.download = '';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleSign = () => {
    setSignOpen(true);
  };

  const handleReject = () => {
    toast({ title: 'Rechazar', description: 'Funcionalidad no implementada.' });
    setRejectOpen(false);
  };

  const handleSummarize = () => {
    if (!detalle) return;
    summaryDialogRef.current?.open();
  };

  const progress = firmantes.length
    ? (firmantes.filter((f) => f.estaFirmado).length / firmantes.length) * 100
    : 0;
  const signersPanel: Signer[] = firmantes.map((f) => {
    const foto = f.user.urlFoto ?? f.user.avatar ?? null;
    return {
      id: f.user.id,
      nombre: f.user.nombre,
      iniciales: initials(f.user.nombre),
      responsabilidad: f.responsabilidad.nombre,
      puesto: f.user.posicion,
      gerencia: f.user.gerencia,
      estaFirmado: f.estaFirmado,
      urlFoto: foto,
      avatar: foto,
    } satisfies Signer;
  });

  const orderResponsabilidad = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.startsWith('elabora')) return 1;
    if (n.startsWith('revisa')) return 2;
    if (n.startsWith('aprueba')) return 3;
    return 99;
  };

  const myAssignments = firmantes.filter((f) => f.user.id === currentUser?.id);
  const myPending = myAssignments.filter((f) => !f.estaFirmado);
  const myOrder = myPending.length
    ? Math.min(...myPending.map((p) => orderResponsabilidad(p.responsabilidad.nombre)))
    : Infinity;
  const blockingSigner = firmantes.find(
    (f) => orderResponsabilidad(f.responsabilidad.nombre) < myOrder && !f.estaFirmado,
  );
  const canSign = myPending.length > 0 && !blockingSigner;
  const blockMessage = blockingSigner
    ? `No puede firmar hasta que firme: ${blockingSigner.user.nombre}`
    : !myPending.length
      ? 'No tienes firmas pendientes'
      : undefined;

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

  if (!detalle) {
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
        <h1 className="text-2xl font-semibold">{detalle.titulo}</h1>
        {detalle.descripcion && <p className="text-muted-foreground">{detalle.descripcion}</p>}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8">
            {pdfError ? (
              <div className="w-full h-[70vh] rounded-xl bg-muted flex flex-col items-center justify-center">
                <p className="mb-4 text-sm text-muted-foreground">No se pudo cargar el PDF.</p>
                <Button onClick={() => detalle && fetchDetalle(detalle.id)}>Reintentar</Button>
              </div>
            ) : (
              <DocumentPdfViewer
                key={detalle.urlCuadroFirmasPDF}
                src={detalle.urlCuadroFirmasPDF}
                onError={() => setPdfError(true)}
              />
            )}
          </div>
          <div className="col-span-12 md:col-span-4 space-y-4">
            <SignersPanel firmantes={signersPanel} progress={progress} />
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleSign}
                className="flex-1"
                disabled={!canSign}
                title={blockMessage}
              >
                Firmar
              </Button>
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setRejectOpen(true)}
                  disabled={!canSign}
                >
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
              {!canSign && blockMessage && (
                <p className="text-xs text-muted-foreground">{blockMessage}</p>
              )}
              <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Resumen con IA</h3>
              </div>
              <Button onClick={handleSummarize} className="w-full">
                Resumir Documento
              </Button>
            </div>
          </div>
        </div>
      </main>
      {detalle && currentUser && (
        <SignDialog
          open={signOpen}
          onClose={() => setSignOpen(false)}
          cuadroFirmaId={detalle.id}
          firmantes={firmantes}
          currentUserId={currentUser.id}
          onSigned={async () => {
            await fetchDetalle(detalle.id);
          }}
        />
      )}
      {detalle && (
        <DocumentSummaryDialog
          ref={summaryDialogRef}
          documentId={detalle.id}
          cuadroFirmasId={detalle.id}
          pdfUrl={detalle.urlCuadroFirmasPDF}
        />
      )}
    </div>
  );
}
