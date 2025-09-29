'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useParams } from 'next/navigation';
import { GeneralHeader } from '@/components/general-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, Download, Loader2, Wand2 } from 'lucide-react';
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
  DialogCloseButton,
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
import {
  DocumentSummaryDialog,
  type DocumentSummaryDialogHandle,
} from '@/components/ai/DocumentSummaryDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  const summaryDialogRef = useRef<DocumentSummaryDialogHandle>(null);

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
    event: MouseEvent<HTMLButtonElement>,
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

  const myAssignments = firmantes.filter((f) => f.user.id === currentUser?.id);
  const myPending = myAssignments.filter((f) => !f.estaFirmado);
  const isAssignedToMe = myAssignments.length > 0;
  const hasPendingSignature = myPending.length > 0;
  const alreadySigned = isAssignedToMe && !hasPendingSignature;
  const canSign = isAssignedToMe && hasPendingSignature;
  const canReject = isAssignedToMe && !alreadySigned;
  const actionTitle = !isAssignedToMe
    ? 'No tienes firmas pendientes'
    : alreadySigned
      ? 'Ya has firmado este documento.'
      : 'Puedes firmar este documento cuando estés listo.';
  const statusMessage = !isAssignedToMe || canSign
    ? actionTitle
    : '';

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
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">{detalle.titulo}</h1>
        {detalle.descripcion && <p className="text-muted-foreground">{detalle.descripcion}</p>}
        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Mobile: IA summary arriba */}
          <div className="col-span-12 md:hidden">
            <div className="pt-2 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="font-medium">Resumen con IA</h3>
              </div>
              <Button onClick={handleSummarize} className="w-full">
                Resumir Documento
              </Button>
            </div>
          </div>
          <div className="col-span-12 md:col-span-8 xl:col-span-9">
            <div
              className="h-[calc(100dvh-var(--app-header-h)-theme(spacing.10))] min-h-0 pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-0"
            >
              <div className="flex min-h-full flex-col gap-3">
                <div className="flex-1 min-h-0">
                  <DocumentTabs
                    urlCuadroFirmasPDF={detalle.urlCuadroFirmasPDF}
                    urlDocumento={detalle.urlDocumento}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-12 space-y-4 md:col-span-4 xl:col-span-3">
            <Accordion
              type="single"
              collapsible
              className="rounded-xl border bg-background md:hidden"
              defaultValue="signers"
            >
              <AccordionItem value="signers" className="border-none">
                <AccordionTrigger className="px-4 text-left text-base font-medium">
                  Firmantes
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <SignersPanel firmantes={signersPanel} progress={progress} showHeader={false} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="hidden md:block">
              <SignersPanel firmantes={signersPanel} progress={progress} />
            </div>
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
            <div className="md:static sticky bottom-0 z-20 mt-4 border-t bg-background/80 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {alreadySigned ? (
                <div className="flex h-14 items-center justify-center rounded-xl border bg-muted/40 px-3 text-center text-sm font-medium text-muted-foreground md:h-12 md:text-base">
                  Ud ya ha firmado este documento
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Button
                      onClick={handleSign}
                      className="w-full h-14 rounded-2xl md:h-12 md:rounded-xl"
                      disabled={!canSign}
                      title={actionTitle}
                    >
                      Firmar
                    </Button>
                    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                      <Button
                        variant="destructive"
                        className="w-full h-14 rounded-2xl md:h-12 md:rounded-xl"
                        onClick={() => setRejectOpen(true)}
                        disabled={!canReject}
                        title={actionTitle}
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
                          <DialogCloseButton
                            variant="secondary"
                            onClick={() => setRejectOpen(false)}
                          >
                            Cancelar
                          </DialogCloseButton>
                          <Button onClick={handleReject}>Enviar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {statusMessage && (
                    <p className="mt-2 text-xs text-muted-foreground">{statusMessage}</p>
                  )}
                </>
              )}
            </div>
            
            <div className="pt-4 space-y-2 hidden md:block">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
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
          docData={detalle}
        />
      )}
    </div>
  );
}
