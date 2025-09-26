"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [loading, setLoading] = useState(false);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSignature, setCurrentSignature] = useState<string | null>(signatureUrl);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setResponsabilidadId(pendientes[0]?.responsabilidad.id);
    }
  }, [open, pendientes]);

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
      setConfirmChecked(false);
    }
  }, [open]);

  useEffect(() => {
    setCurrentSignature(signatureUrl);
  }, [signatureUrl]);

  const hasSignature = !!currentSignature;

  const handleSaveSignature = async () => {
    if (!signatureCanvasRef.current) return;
    if (signatureCanvasRef.current.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Lienzo Vacío',
        description: 'Por favor, dibuje su firma antes de guardar.',
      });
      return;
    }
    const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
    const blob = await fetch(dataUrl).then((r) => r.blob());
    try {
      const { data } = await updateMySignature(blob);
      const url = (data as any)?.url ?? (data as any)?.signatureUrl ?? data;
      setCurrentSignature(url);
      toast({ title: 'Firma Guardada' });
      await refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la firma.',
      });
    }
  };

  const handleSignatureFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { data } = await updateMySignature(file);
        const url = (data as any)?.url ?? (data as any)?.signatureUrl ?? data;
        setCurrentSignature(url);
        toast({ title: 'Firma Actualizada' });
        await refresh();
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo actualizar la firma.',
        });
      }
    }
  };

  const performSignature = useCallback(async () => {
    if (!responsabilidadId || !hasSignature) return false;
    const resp = pendientes.find((p) => p.responsabilidad.id === responsabilidadId);
    if (!resp) return false;
    setLoading(true);
    try {
      await signDocument({
        cuadroFirmaId,
        userId: currentUserId,
        nombreUsuario: resp.user.nombre,
        responsabilidadId: resp.responsabilidad.id,
        nombreResponsabilidad: resp.responsabilidad.nombre,
        useStoredSignature: true,
      });
      await onSigned();
      onClose();
      toast({ title: 'Firma registrada' });
      return true;
    } catch (e: any) {
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
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    responsabilidadId,
    hasSignature,
    pendientes,
    cuadroFirmaId,
    currentUserId,
    onSigned,
    onClose,
    toast,
  ]);

  const handleConfirmDialogChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setConfirmChecked(false);
    }
  };

  const handleConfirmAndSign = async () => {
    const success = await performSignature();
    if (success) {
      setConfirmChecked(false);
      setConfirmOpen(false);
    }
  };

  const canSign = pendientes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Firmar documento</DialogTitle>
        </DialogHeader>
        {canSign ? (
          <div className="space-y-4 py-2">
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              <ul className="space-y-2">
                {firmantes.map((f) => (
                  <li key={`${f.user.id}-${f.responsabilidad.id}`} className="flex items-center justify-between">
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
            {hasSignature ? (
              <div className="space-y-2">
                <p className="text-sm">Mi firma</p>
                <div className="w-full h-32 border rounded flex items-center justify-center bg-muted/50">
                  {currentSignature && (
                    <Image
                      src={currentSignature}
                      alt="Firma"
                      width={200}
                      height={100}
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <Tabs defaultValue="draw" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">
                    <PenLine className="mr-2 h-4 w-4" /> Dibujar
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="mr-2 h-4 w-4" /> Subir imagen
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="draw" className="space-y-2">
                  <SignaturePad ref={signatureCanvasRef} />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => signatureCanvasRef.current?.clear()}>
                      <Trash2 className="mr-2 h-4 w-4" /> Limpiar
                    </Button>
                    <Button size="sm" onClick={handleSaveSignature}>
                      Guardar Firma
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="upload">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleSignatureFileChange}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        ) : (
          <p className="py-4">No tienes firmas pendientes</p>
        )}
        <DialogFooter>
          <DialogCloseButton variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </DialogCloseButton>
          <Button
            onClick={() => {
              if (!canSign || !hasSignature || !responsabilidadId) return;
              setConfirmChecked(false);
              setConfirmOpen(true);
            }}
            disabled={!canSign || !hasSignature || !responsabilidadId || loading}
          >
            Firmar con mi firma
          </Button>
        </DialogFooter>
        <AlertDialog open={confirmOpen} onOpenChange={handleConfirmDialogChange}>
          <AlertDialogContent aria-describedby="confirm-sign-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar firma</AlertDialogTitle>
              <AlertDialogDescription id="confirm-sign-description">
                ¿Confirmas que has leído el documento y deseas firmarlo con tu firma registrada?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id="confirm-read-checkbox"
                checked={confirmChecked}
                onCheckedChange={(checked) => setConfirmChecked(Boolean(checked))}
                disabled={loading}
              />
              <label
                htmlFor="confirm-read-checkbox"
                className="select-none text-sm leading-snug"
              >
                Confirmo que he leído el contenido del documento.
              </label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirmAndSign();
                }}
                disabled={!confirmChecked || loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Confirmar y firmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
