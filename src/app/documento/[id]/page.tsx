"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GeneralHeader } from '@/components/general-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, Download, Loader2 } from 'lucide-react';
import { SignersPanel } from '@/components/document-detail/signers-panel';
import {
  getCuadroFirmaDetalle,
  getFirmantes,
  fetchMergedPdf,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/store/auth';
import { fullName, initials } from '@/lib/avatar';
import { SignDialog } from '@/components/sign-dialog';
import { DocumentTabs } from '@/components/document/DocumentTabs';
import { api } from '@/lib/api';

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [detalle, setDetalle] = useState<CuadroFirmaDetalle | null>(null);
  const [firmantes, setFirmantes] = useState<SignerFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [refreshingLinks, setRefreshingLinks] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fetchDetalle = async (id: number) => {
    setLoading(true);
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
    if (params?.id) {
      fetchDetalle(Number(params.id));
    }
    setSummaryStatus('idle');
    setSummaryError(null);
    setSummaryText(null);
    setSaveStatus('idle');
  }, [params?.id]);

  const handleOpenMerged = async () => {
    if (!detalle?.id) return;
    try {
      setDownloading(true);
      const blob = await fetchMergedPdf(detalle.id, { download: false });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo abrir el PDF combinado.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadMerged = async () => {
    if (!detalle?.id) return;
    try {
      setDownloading(true);
      const blob = await fetchMergedPdf(detalle.id, { download: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento-firmas.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo descargar el PDF combinado.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadButtonClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (downloading) return;
    if (event.altKey) {
      await handleDownloadMerged();
    } else {
      await handleOpenMerged();
    }
  };

  const handleSign = () => {
    setSignOpen(true);
  };

  const handleReject = () => {
    toast({ title: 'Rechazar', description: 'Funcionalidad no implementada.' });
    setRejectOpen(false);
  };

  const handleRefreshLinks = async () => {
    if (!detalle?.id || refreshingLinks) return;
    try {
      setRefreshingLinks(true);
      const updated = await getCuadroFirmaDetalle(detalle.id, 3600);
      setDetalle((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el vínculo del documento.',
      });
    } finally {
      setRefreshingLinks(false);
    }
  };

  const handleSummarize = async () => {
    if (!detalle?.id || summarizing) return;
    try {
      setSummarizing(true);
      setSummaryStatus('idle');
      setSummaryError(null);
      setSaveStatus('idle');
      // TODO: Ajustar payload según contrato real del endpoint
      const { data } = await api.post<{ summary?: string }>(
        `/documents/${detalle.id}/summary`,
      );
      const summaryResponse = (data as any)?.summary ?? (data as any)?.data?.summary ?? null;
      if (!summaryResponse) {
        throw new Error('Resumen no disponible.');
      }
      setSummaryText(summaryResponse);
      setSummaryStatus('success');
    } catch (error) {
      setSummaryStatus('error');
      setSummaryError('No se pudo generar el resumen.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el resumen.',
      });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!detalle?.id || !summaryText || saveStatus === 'saving') return;
    try {
      setSaveStatus('saving');
      // TODO: Ajustar payload según contrato real del endpoint
      await api.patch(`/documents/${detalle.id}/summary`, { summary: summaryText });
      setSaveStatus('success');
      toast({ title: 'Resumen guardado', description: 'El resumen se guardó correctamente.' });
    } catch (error) {
      setSaveStatus('error');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el resumen.',
      });
    }
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
            <Skeleton className="col-span-12 h-[70vh] md:col-span-8 xl:col-span-9" />
            <div className="col-span-12 space-y-4 md:col-span-4 xl:col-span-3">
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
          <div className="col-span-12 space-y-4 md:col-span-8 xl:col-span-9">
            <DocumentTabs
              urlCuadroFirmasPDF={detalle.urlCuadroFirmasPDF}
              urlDocumento={detalle.urlDocumento}
              onRefreshLinks={handleRefreshLinks}
              isRefreshingLinks={refreshingLinks}
              onSummarize={handleSummarize}
              summarizing={summarizing}
              summaryStatus={summaryStatus}
              summaryError={summaryError}
              summaryText={summaryText}
              onSaveSummary={summaryText ? handleSaveSummary : undefined}
              saveStatus={saveStatus}
            />
          </div>
          <div className="col-span-12 space-y-4 md:col-span-4 xl:col-span-3">
            <SignersPanel firmantes={signersPanel} progress={progress} />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadButtonClick}
                variant="outline"
                disabled={downloading}
                title="Abre el PDF del documento unido con el cuadro de firmas."
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Descargar PDF
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={downloading}
                    aria-label="Más opciones de descarga"
                    title="Opciones de descarga"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      void handleDownloadMerged();
                    }}
                    disabled={downloading}
                  >
                    Descargar .pdf
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
    </div>
  );
}
