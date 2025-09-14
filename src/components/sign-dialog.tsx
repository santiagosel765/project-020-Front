"use client";

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signDocument, SignerFull } from '@/services/documentsService';
import { Loader2 } from 'lucide-react';

export type SignDialogProps = {
  open: boolean;
  onClose: () => void;
  cuadroFirmaId: number;
  firmantes: SignerFull[];
  currentUserId: number;
  onSigned: () => Promise<void>;
  defaultSignatureFile?: File | null;
};

export function SignDialog({
  open,
  onClose,
  cuadroFirmaId,
  firmantes,
  currentUserId,
  onSigned,
  defaultSignatureFile,
}: SignDialogProps) {
  const { toast } = useToast();
  const pendientes = useMemo(
    () => firmantes.filter((f) => f.user.id === currentUserId && !f.estaFirmado),
    [firmantes, currentUserId],
  );
  const [responsabilidadId, setResponsabilidadId] = useState<number | undefined>(
    pendientes[0]?.responsabilidad.id,
  );
  const [file, setFile] = useState<File | null>(defaultSignatureFile ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setResponsabilidadId(pendientes[0]?.responsabilidad.id);
      setFile(defaultSignatureFile ?? null);
    }
  }, [open, pendientes, defaultSignatureFile]);

  const handleSubmit = async () => {
    if (!responsabilidadId || !file) return;
    const resp = pendientes.find((p) => p.responsabilidad.id === responsabilidadId);
    if (!resp) return;
    setLoading(true);
    try {
      await signDocument({
        cuadroFirmaId,
        userId: currentUserId,
        nombreUsuario: resp.user.nombre,
        responsabilidadId: resp.responsabilidad.id,
        nombreResponsabilidad: resp.responsabilidad.nombre,
        file,
      });
      await onSigned();
      onClose();
      toast({ title: 'Firma registrada' });
    } catch (e: any) {
      if (e?.message === 'Usuario no autorizado' || e?.status === 403) {
        toast({ variant: 'destructive', title: 'Error', description: 'No estás autorizado para firmar este documento.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo firmar. Intenta de nuevo.' });
      }
    } finally {
      setLoading(false);
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
            {pendientes.length > 1 && (
              <select
                className="w-full border rounded p-2"
                value={responsabilidadId}
                onChange={(e) => setResponsabilidadId(Number(e.target.value))}
              >
                {pendientes.map((p) => (
                  <option key={p.responsabilidad.id} value={p.responsabilidad.id}>
                    {p.responsabilidad.nombre}
                  </option>
                ))}
              </select>
            )}
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        ) : (
          <p className="py-4">No tienes firmas pendientes</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSign || !file || !responsabilidadId || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Firmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

