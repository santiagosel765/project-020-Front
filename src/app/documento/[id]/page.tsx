

"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { User, Document } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Info, Sparkles, Download } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { summarizeDocument, SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { GeneralHeader } from '@/components/general-header';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { calculateBusinessDays, parseDate } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SignaturePad } from '@/components/signature-pad';
import SignatureCanvas from 'react-signature-canvas';
import api from '@/lib/axiosConfig';
import { useSession } from '@/lib/session';

type SignatoryStatus = 'FIRMADO' | 'RECHAZADO' | 'PENDIENTE';

type Signatory = User & {
  status: SignatoryStatus;
  responsibility: 'REVISA' | 'APRUEBA' | 'ENTERADO';
  rejectionReason?: string;
  statusChangeDate: string; 
};

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 2) return `${names[0][0]}${names[2][0]}`.toUpperCase();
  if (names.length > 1) return `${names[0][0]}${names[1][0]}`.toUpperCase();
  return names[0] ? names[0][0].toUpperCase() : '';
};

const getStatusClass = (status: SignatoryStatus): string => {
    switch (status) {
      case 'FIRMADO': return 'bg-green-100 text-green-800 border-green-400';
      case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-400';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
};

const StatusBadge = ({ status, rejectionReason }: { status: SignatoryStatus, rejectionReason?: string }) => {
    const badge = (
        <Badge className={cn("border", getStatusClass(status))}>
            {status}
        </Badge>
    );

    if (status === 'RECHAZADO' && rejectionReason) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                        {badge}
                        <Info className="h-4 w-4 text-red-600" />
                    </div>
                </DialogTrigger>
                <DialogContent className="glassmorphism">
                    <DialogHeader>
                        <DialogTitle>Motivo del Rechazo</DialogTitle>
                        <DialogDescription className="pt-2">
                            {rejectionReason}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {badge}
        </div>
    );
};

export default function DocumentoDetallePage() {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { me } = useSession();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [streamedSummary, setStreamedSummary] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [isSignedByCurrentUser, setIsSignedByCurrentUser] = useState(false);

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  
  useEffect(() => {
    setIsClient(true);
    const roles: string[] = me?.roles ?? [];
    const role = roles.includes('ADMIN')
      ? 'admin'
      : roles.includes('SUPERVISOR')
        ? 'supervisor'
        : 'general';
    setUserRole(role);
    setCurrentUserId(me?.id ?? null);

    const fetchDocument = async () => {
        if (!id) return;
        setIsLoadingDoc(true);
        try {
            const { data: doc } = await api.get<Document>(`/documents/cuadro-firmas/${id}`);
            setDocument(doc);

            const fileName = doc?.filePath?.split('/').pop()?.replace(/\.pdf$/i, '');
            if (fileName) {
                try {
                  const { data: urlData } = await api.get(`/documents/cuadro-firmas/documento-url`, { params: { fileName } });
                  setPdfSrc((urlData as any)?.url ?? urlData);
                } catch (e) {
                  console.error('pdf url error', e);
                }
            }

            try {
              const { data: firmData } = await api.get(`/documents/cuadro-firmas/firmantes/${id}`);
              const list: any[] = firmData?.data ?? firmData ?? [];
              const mapped = list.map((u: any) => ({
                id: Number(u.idUser ?? u.userId ?? u.id ?? 0),
                name: u.nombre ?? u.name ?? '',
                avatar: u.avatar ?? u.foto ?? '',
                position: u.puesto ?? u.position ?? '',
                department: u.gerencia ?? u.department ?? '',
                responsibility: (u.nombreResponsabilidad ?? u.responsabilidad ?? '') as Signatory['responsibility'],
                status: (u.estado ?? u.estadoFirma ?? 'PENDIENTE') as SignatoryStatus,
                rejectionReason: u.observaciones ?? u.rejectionReason,
                statusChangeDate: u.fechaCambio ?? u.statusChangeDate ?? doc.sendDate,
              })) as unknown as Signatory[];
              setSignatories(mapped.sort((a, b) => a.name.localeCompare(b.name)));
            } catch (e) {
              console.error('firmantes error', e);
              setSignatories([]);
            }
        } catch (error) {
            setDocument(null);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cargar el documento.",
            });
        } finally {
            setIsLoadingDoc(false);
        }
    };

    fetchDocument();

  }, [id, toast, me]);

  const canSignOrReject = useMemo(() => {
    if (!isClient || !currentUserId || userRole === 'supervisor' || !document) {
      return false;
    }
    const assigned = document.assignedUsers ?? [];
    return assigned.some((user: any) => user.id === currentUserId);
  }, [isClient, userRole, currentUserId, document]);


  const signatureProgress = useMemo(() => {
    if (!document) return 0;
    const signedCount = signatories.filter(s => s.status === 'FIRMADO').length;
    const totalCount = signatories.length;
    return totalCount > 0 ? (signedCount / totalCount) * 100 : 0;
  }, [signatories, document]);


  if (isLoadingDoc) {
    return (
      <div className="flex flex-col h-screen">
        <GeneralHeader />
        <main className="flex-1 p-4 md:p-6">
          <Card className="w-full h-full glassmorphism">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="md:col-span-2 h-[600px] w-full" />
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!document) {
    return (
        <div className="flex flex-col h-screen">
            <GeneralHeader />
            <main className="flex-1 p-4 md:p-6 overflow-auto flex items-center justify-center">
             <p>Documento no encontrado.</p>
            </main>
        </div>
    );
  }

  const handleSign = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
        toast({
            variant: "destructive",
            title: "Firma requerida",
            description: "Por favor, dibuje su firma antes de continuar.",
        });
        return;
    }
    setIsSigning(true);
    try {
        const canvas = signatureCanvasRef.current.getTrimmedCanvas();
        const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        const formData = new FormData();
        formData.append('file', blob, 'signature.png');
        formData.append('cuadroFirmaId', String(id));
        formData.append('userId', String(me?.id ?? ''));
        formData.append('nombreUsuario', (me as any)?.name ?? '');
        const current = signatories.find((s) => String(s.id) === String(me?.id));
        if (current) {
          const respId = (current as any).responsabilidadId ?? (current as any).responsibilityId;
          if (respId != null) formData.append('responsabilidadId', String(respId));
          formData.append('nombreResponsabilidad', current.responsibility);
        }
        await api.post('/documents/cuadro-firmas/firmar', formData);
        const signature = canvas.toDataURL('image/png');
        setUserSignature(signature);
        setIsSignedByCurrentUser(true);
        toast({
            title: "Documento Firmado",
            description: "El documento ha sido firmado exitosamente.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error al firmar",
            description: "No se pudo enviar la firma. Inténtelo nuevamente.",
        });
    } finally {
        setIsSigning(false);
        signatureCanvasRef.current?.clear();
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "La justificación del rechazo es obligatoria.",
        });
        return;
    }
    setIsRejecting(true);
    // Simulate API call
    setTimeout(() => {
        toast({
            variant: "destructive",
            title: "Documento Rechazado",
            description: "Ha rechazado la firma del documento.",
        });
        setIsRejecting(false);
    }, 1500);
  };

  const loadPdfUrl = async () => {
    if (!document?.filePath) return;
    const fileName = document.filePath.split('/').pop()?.replace(/\.pdf$/i, '');
    if (!fileName) return;
    try {
      const { data } = await api.get(`/documents/cuadro-firmas/documento-url`, { params: { fileName } });
      setPdfSrc((data as any)?.url ?? data);
    } catch (e) {
      console.error('refresh pdf', e);
    }
  };

  const handleDownload = async () => {
    await loadPdfUrl();
    if (!pdfSrc) return;
    const link = window.document.createElement('a');
    link.href = pdfSrc;
    link.download = `${document?.name}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const streamText = (text: string, interval = 20) => {
    return new Promise<void>((resolve) => {
      let index = 0;
      const words = text.split(' ');
      
      const timer = setInterval(() => {
        if (index < words.length) {
          setStreamedSummary(prev => prev + words[index] + ' ');
          index++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  };

  const handleGenerateSummary = async () => {
    setIsSummarizing(true);
    setSummary(null);
    setStreamedSummary('');
    try {
        const documentText = `Título: ${document.name}\n\nDescripción: ${document.description}\n\nEste documento es un ejemplo para demostrar la funcionalidad de resumen. En un caso real, aquí iría el contenido completo del PDF. El documento contiene cláusulas de confidencialidad y políticas de uso.`;
        
        await streamText("Analizando documento... Identificando políticas, cláusulas y párrafos clave.\n\n", 50);

        const result = await summarizeDocument({ documentText });
        setSummary(result);

        if (result.summary) {
          await streamText(result.summary, 30);
        }

    } catch (error) {
        console.error("Error al generar el resumen:", error);
        toast({
            variant: "destructive",
            title: "Error de IA",
            description: "No se pudo generar el resumen del documento.",
        });
    } finally {
        setIsSummarizing(false);
    }
};

  return (
    <div className="flex flex-col h-screen">
        <GeneralHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Card className="w-full h-full flex flex-col glassmorphism">
                <CardHeader>
                <CardTitle>{document.name}</CardTitle>
                <CardDescription>{document.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                {/* PDF Viewer Section */}
                <div className="md:col-span-2 bg-muted/30 border rounded-lg overflow-hidden">
                    {pdfSrc ? (
                        <embed
                            src={`${pdfSrc}#toolbar=0`}
                            type="application/pdf"
                            className="w-full h-full"
                            title={document.name}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Signatories and Actions Section */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Firmantes ({signatories.length})</h3>
                            {isClient && <span className="text-sm text-muted-foreground">{`${Math.round(signatureProgress)}% completado`}</span>}
                        </div>
                        <Progress value={signatureProgress} className="w-full" />
                        <div className="space-y-3">
                            {signatories.map(user => {
                              const daysElapsed = calculateBusinessDays(parseDate(user.statusChangeDate), new Date());
                              return (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar} data-ai-hint="person avatar" />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.position} - {user.responsibility}</p>
                                        <p className="text-xs text-muted-foreground">Días transcurridos: {daysElapsed}</p>
                                    </div>
                                    </div>
                                    <StatusBadge status={user.status} rejectionReason={user.rejectionReason} />
                                </div>
                              )
                            })}
                        </div>
                    </div>
                    
                    <Separator />

                     {isClient && userRole === 'admin' && (
                        <div className="space-y-4">
                           <Button onClick={handleDownload} variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </Button>
                        </div>
                    )}
                    
                    {canSignOrReject && (
                        <div className="space-y-4">
                            {!isSignedByCurrentUser && (
                                <div className="space-y-2">
                                    <Label>Firma</Label>
                                    <SignaturePad ref={signatureCanvasRef} />
                                </div>
                            )}
                            {isSignedByCurrentUser && userSignature && (
                                <div className="space-y-2">
                                    <Label>Su Firma</Label>
                                    <div className='w-full h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/50'>
                                        <Image src={userSignature} alt="Firma del usuario" width={200} height={100} style={{objectFit: 'contain'}} />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <Button onClick={handleSign} className="flex-1" disabled={isSigning || isSignedByCurrentUser}>
                                    {isSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSignedByCurrentUser ? 'Firmado' : 'Firmar Documento'}
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="flex-1" disabled={isSignedByCurrentUser}>Rechazar</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Justificar Rechazo</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Por favor, explique por qué está rechazando este documento. Esta información será registrada en la auditoría.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <Textarea
                                            placeholder="Escriba aquí su justificación..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleReject} disabled={isRejecting}>
                                            {isRejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Aceptar
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}
                    
                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Resumen con IA</h3>
                      </div>
                      <Button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full">
                          {isSummarizing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          {isSummarizing ? "Generando resumen..." : "Resumir Documento"}
                      </Button>
                      {(isSummarizing || streamedSummary) && (
                          <div className="p-4 bg-muted/50 rounded-lg text-sm">
                          <p>{streamedSummary}</p>
                          </div>
                      )}
                    </div>
                </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
