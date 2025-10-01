"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signDocument, SignerFull } from '@/services/documentsService';
import { Loader2, PenLine, Upload, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignaturePad } from './signature-pad';
import type SignatureCanvas from 'react-signature-canvas';
import { Input } from '@/components/ui/input';
import { updateMySignature } from '@/services/api/users';
import { useSession } from '@/lib/session';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle as ExclamationTriangleIcon } from 'lucide-react';
import {
  SignatureValidationError,
  validateAndSanitizeSignature,
} from '@/lib/signature-validation';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD } from '@/lib/uploads';

export type SignDialogProps = {
  open: boolean;
  onClose: () => void;
  cuadroFirmaId: number;
  firmantes: SignerFull[];
  currentUserId: number;
  onSigned: () => Promise<void>;
};

export function SignDialog({
  open,
  onClose,
  cuadroFirmaId,
  firmantes,
  currentUserId,
  onSigned,
}: SignDialogProps) {
  const { toast } = useToast();
  const { signatureUrl, refresh } = useSession();
  const pendientes = useMemo(
    () => firmantes.filter((f) => f.user.id === currentUserId && !f.estaFirmado),
    [firmantes, currentUserId],
  );
  const [responsabilidadId, setResponsabilidadId] = useState<number | undefined>(
    pendientes[0]?.responsabilidad.id,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSignature, setCurrentSignature] = useState<string | null>(signatureUrl);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [mode, setMode] = useState<'stored' | 'draw' | 'upload'>('stored');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isCanvasDirty, setIsCanvasDirty] = useState(false);

  const handleClearCanvas = useCallback(() => {
    signatureCanvasRef.current?.clear();
    setIsCanvasDirty(false);
  }, []);

  useEffect(() => {
    if (open) {
      setResponsabilidadId(pendientes[0]?.responsabilidad.id);
    }
  }, [open, pendientes]);

  useEffect(() => {
    if (!open) {
      setConfirmChecked(false);
    }
  }, [open]);

  useEffect(() => {
    setCurrentSignature(signatureUrl);
  }, [signatureUrl]);

  const handleSignatureError = useCallback(
    (error: unknown) => {
      if (error instanceof SignatureValidationError) {
        const descriptions: Record<
          SignatureValidationError['code'],
          string
        > = {
          'invalid-type': 'Formato no permitido (solo PNG/JPG).',
          'file-too-large': 'Archivo demasiado grande (máximo 2 MB).',
          'invalid-dimensions': 'Dimensiones no válidas (máximo 800×400 px).',
          'invalid-aspect': 'Relación de aspecto no válida (entre 2:1 y 8:1).',
          'invalid-ink': 'La imagen no parece una firma (demasiado vacía o demasiada tinta).',
          'empty-image': 'La imagen no parece una firma (demasiado vacía o demasiada tinta).',
        };
        toast({
          variant: 'destructive',
          title: 'Imagen no válida',
          description: descriptions[error.code] ?? 'No se pudo validar la firma.',
        });
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la firma. Intenta nuevamente.',
      });
    },
    [toast],
  );

  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    setUploadPreview(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      toast({
        variant: 'destructive',
        title: 'Formato no permitido',
        description: 'Solo se aceptan imágenes PNG o JPG.',
      });
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    if (file.size > MAX_UPLOAD) {
      toast({
        variant: 'destructive',
        title: 'Archivo demasiado grande',
        description: 'El tamaño máximo permitido es de 2 MB.',
      });
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    setIsUploadingSignature(true);
    try {
      const { blob } = await validateAndSanitizeSignature(file);
      const { data } = await updateMySignature(blob);
      console.log(data)
      const url = data.data.url ?? data.data.signatureUrl;
      if (!url) {
        throw new Error('No se recibió la URL de la firma.');
      }
      setUploadPreview(url);
      setCurrentSignature(url);
      await refresh().catch(() => undefined);
      toast({ title: 'Firma actualizada' });
    } catch (error) {
      console.log({error})
      handleSignatureError(error);
      setUploadPreview(null);
    } finally {
      setIsUploadingSignature(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSign = useCallback(async () => {
    if (isSubmitting || !responsabilidadId || !confirmChecked) {
      return;
    }

    const resp = pendientes.find((p) => p.responsabilidad.id === responsabilidadId);
    if (!resp) return;

    if (mode === 'stored' && !currentSignature) {
      toast({
        variant: 'destructive',
        title: 'Sin firma guardada',
        description: 'No cuentas con una firma almacenada.',
      });
      return;
    }

    if (mode === 'draw' && !isCanvasDirty) {
      toast({
        variant: 'destructive',
        title: 'Lienzo vacío',
        description: 'Por favor, dibuja tu firma para continuar.',
      });
      return;
    }

    if (mode === 'upload' && !uploadPreview) {
      toast({
        variant: 'destructive',
        title: 'Sin archivo',
        description: 'Selecciona una imagen válida para continuar.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'draw') {
        if (!signatureCanvasRef.current) {
          throw new Error('No se pudo acceder al lienzo de firma.');
        }
        const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
        const canvasBlob = await fetch(dataUrl).then((r) => r.blob());
        const normalizedBlob = canvasBlob.type
          ? canvasBlob
          : new Blob([canvasBlob], { type: 'image/png' });
        const { blob } = await validateAndSanitizeSignature(normalizedBlob);
        const { data } = await updateMySignature(blob);
        const url = data.data.url ?? data.data.signatureUrl;
        if (!url) {
          throw new Error('No se recibió la URL de la firma.');
        }
        setCurrentSignature(url);
        setUploadPreview(url);
        await refresh().catch(() => undefined);
        toast({ title: 'Firma actualizada' });
        handleClearCanvas();
      }

      await signDocument({
        cuadroFirmaId,
        userId: currentUserId,
        nombreUsuario: resp.user.nombre,
        responsabilidadId: resp.responsabilidad.id,
        nombreResponsabilidad: resp.responsabilidad.nombre,
        useStoredSignature: true,
      });
      toast({ title: 'Firma registrada' });
      setConfirmChecked(false);
      handleClearCanvas();
      setMode('stored');
      setUploadPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await onSigned();
      onClose();
    } catch (e: any) {
      if (e instanceof SignatureValidationError) {
        handleSignatureError(e);
        return;
      }

      const status = e?.status ?? e?.response?.status;
      const serverMessage =
        e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;

      if (status === 403) {
        toast({
          variant: 'destructive',
          title: 'No autorizado',
          description: 'Su sesión no coincide con el usuario que intenta firmar.',
        });
      } else if (status === 400 && !serverMessage) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No cuenta con firma guardada. Cárguela o dibújela para continuar.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: serverMessage ?? 'No se pudo firmar. Intenta de nuevo.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    responsabilidadId,
    confirmChecked,
    pendientes,
    cuadroFirmaId,
    currentUserId,
    toast,
    onSigned,
    onClose,
    mode,
    currentSignature,
    uploadPreview,
    refresh,
    handleClearCanvas,
    handleSignatureError,
  ]);

  const canSign = pendientes.length > 0;
  const canProceedByMode =
    (mode === 'stored' && !!currentSignature) ||
    (mode === 'draw' && isCanvasDirty) ||
    (mode === 'upload' && !!uploadPreview && !isUploadingSignature);
  const canSubmit =
    canSign &&
    !!responsabilidadId &&
    canProceedByMode &&
    confirmChecked &&
    !isSubmitting &&
    !isUploadingSignature;

  useEffect(() => {
    setMode('stored');
    handleClearCanvas();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadPreview(null);
  }, [open, handleClearCanvas]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          if (isSubmitting) return;
          onClose();
        }
      }}
    >
      <DialogContent aria-describedby="sign-desc">
        <DialogHeader>
          <DialogTitle>Firmar documento</DialogTitle>
          <DialogDescription id="sign-desc">
            Selecciona tu responsabilidad, revisa tu firma y confirma que has leído el
            documento.
          </DialogDescription>
        </DialogHeader>
        {canSign ? (
          <>
            <div className="space-y-4 py-2">
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                <ul className="space-y-2">
                  {firmantes.map((f) => (
                    <li
                      key={`${f.user.id}-${f.responsabilidad.id}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={f.user.urlFoto ?? f.user.avatar ?? undefined}
                            alt={f.user.nombre}
                          />
                          <AvatarFallback>{initials(f.user.nombre)}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium">{f.user.nombre}</p>
                          <p className="text-xs text-muted-foreground">{f.responsabilidad.nombre}</p>
                        </div>
                      </div>
                      <Badge variant={f.estaFirmado ? 'default' : 'secondary'}>
                        {f.estaFirmado ? 'Firmado' : 'Pendiente'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            {pendientes.length > 0 && (
              <select
                className="w-full border rounded p-2"
                value={responsabilidadId}
                onChange={(e) => setResponsabilidadId(Number(e.target.value))}
                disabled
              >
                {pendientes.map((p) => (
                  <option key={p.responsabilidad.id} value={p.responsabilidad.id}>
                    {p.responsabilidad.nombre}
                  </option>
                ))}
              </select>
            )}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'stored' | 'draw' | 'upload')} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stored">Firma actual</TabsTrigger>
                <TabsTrigger value="draw">
                  <PenLine className="mr-2 h-4 w-4" /> Dibujar
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="mr-2 h-4 w-4" /> Subir imagen
                </TabsTrigger>
              </TabsList>
              <TabsContent value="stored" className="space-y-2">
                {currentSignature ? (
                  <div className="space-y-2">
                    <p className="text-sm">Mi firma</p>
                    <div className="w-full h-32 border rounded flex items-center justify-center bg-muted/50">
                      <Image
                        src={currentSignature}
                        alt="Mi firma"
                        width={640}
                        height={240}
                        sizes="(max-width: 768px) 100vw, 640px"
                        className="h-auto w-full max-h-40 rounded-md border object-contain"
                        priority
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tienes una firma guardada. Puedes dibujarla o subir una imagen.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="draw" className="space-y-2">
                <SignaturePad
                  ref={signatureCanvasRef}
                  onEnd={() =>
                    setIsCanvasDirty(
                      Boolean(signatureCanvasRef.current && !signatureCanvasRef.current.isEmpty()),
                    )
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCanvas}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Limpiar
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleSignatureFileChange}
                  disabled={isUploadingSignature}
                />
                {isUploadingSignature && (
                  <p className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Procesando firma…
                  </p>
                )}
                {uploadPreview && (
                  <div className="w-full h-32 border rounded flex items-center justify-center bg-muted/50">
                    <Image
                      src={uploadPreview}
                      alt="Vista previa de la firma"
                      width={640}
                      height={240}
                      sizes="(max-width: 768px) 100vw, 640px"
                      className="h-auto w-full max-h-40 rounded-md border object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </div>
            <Alert variant="destructive" className="mt-4">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Confirmación requerida</AlertTitle>
              <AlertDescription>
                Esta firma es <strong>irrevocable</strong>. Asegúrate de haber leído el
                documento.
              </AlertDescription>
            </Alert>
            <div className="mt-3 flex items-start gap-3">
              <Checkbox
                id="confirm-read"
                checked={confirmChecked}
                onCheckedChange={(v) => setConfirmChecked(Boolean(v))}
                disabled={isSubmitting}
              />
              <label htmlFor="confirm-read" className="text-sm leading-5">
                Confirmo que he leído y entiendo el documento y deseo firmarlo
                digitalmente.
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={() => void handleSign()} disabled={!canSubmit}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Firmando…' : 'Firmar con mi firma'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="py-4 text-sm text-muted-foreground">No tienes firmas pendientes</p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
