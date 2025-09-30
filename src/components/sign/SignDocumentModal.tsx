"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type SignatureCanvas from "react-signature-canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/signature-pad";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Loader2, PenLine, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SignSource } from "@/types/signatures";

const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2MB

type Mode = SignSource["mode"];

type StoredSignatureProps = {
  signatureUrl?: string | null;
};

const StoredSignaturePreview = ({ signatureUrl }: StoredSignatureProps) => {
  if (!signatureUrl) {
    return (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No tienes una firma guardada. Puedes dibujarla o subir una imagen para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-48 w-full items-center justify-center rounded-lg border bg-background p-4">
      <img
        src={signatureUrl}
        alt="Firma guardada"
        className="h-full max-h-40 w-full object-contain"
      />
    </div>
  );
};

type SignDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: SignSource) => void | Promise<void>;
  loading?: boolean;
  currentSignatureUrl?: string | null;
};

export function SignDocumentModal({
  open,
  onClose,
  onConfirm,
  loading,
  currentSignatureUrl,
}: SignDocumentModalProps) {
  const { toast } = useToast();
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("stored");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("stored");
      setHasDrawn(false);
      setUploadedFile(null);
      setUploadedPreview(null);
      if (signatureCanvasRef.current) {
        signatureCanvasRef.current.clear();
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
    };
  }, [uploadedPreview]);

  const hasStoredSignature = useMemo(() => Boolean(currentSignatureUrl), [currentSignatureUrl]);

  const handleDrawEnd = useCallback(() => {
    if (!signatureCanvasRef.current) return;
    setHasDrawn(!signatureCanvasRef.current.isEmpty());
  }, []);

  const handleClearDraw = useCallback(() => {
    if (!signatureCanvasRef.current) return;
    signatureCanvasRef.current.clear();
    setHasDrawn(false);
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) {
        setUploadedFile(null);
        setUploadedPreview(null);
        return;
      }

      if (!/image\/png|image\/jpe?g/i.test(file.type)) {
        toast({
          variant: "destructive",
          title: "Formato no permitido",
          description: "Solo se admiten archivos PNG o JPG.",
        });
        event.target.value = "";
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: "La firma debe pesar 2MB o menos.",
        });
        event.target.value = "";
        return;
      }

      setUploadedFile(file);
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
      setUploadedPreview(URL.createObjectURL(file));
    },
    [toast, uploadedPreview],
  );

  const canConfirm = useMemo(() => {
    if (mode === "stored") return hasStoredSignature;
    if (mode === "draw") return hasDrawn;
    if (mode === "upload") return Boolean(uploadedFile);
    return false;
  }, [mode, hasStoredSignature, hasDrawn, uploadedFile]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const handleConfirm = useCallback(async () => {
    if (loading) return;

    if (mode === "stored") {
      if (!hasStoredSignature) {
        toast({
          variant: "destructive",
          title: "Firma no disponible",
          description: "No tienes una firma guardada. Selecciona otra opción.",
        });
        return;
      }
      await onConfirm({ mode: "stored" });
      return;
    }

    if (mode === "draw") {
      const canvas = signatureCanvasRef.current;
      if (!canvas || canvas.isEmpty()) {
        toast({
          variant: "destructive",
          title: "Lienzo vacío",
          description: "Dibuja tu firma antes de continuar.",
        });
        return;
      }
      const dataUrl = canvas.toDataURL("image/png");
      await onConfirm({ mode: "draw", dataUrl });
      return;
    }

    if (mode === "upload") {
      if (!uploadedFile) {
        toast({
          variant: "destructive",
          title: "Archivo requerido",
          description: "Selecciona una imagen de tu firma.",
        });
        return;
      }
      await onConfirm({ mode: "upload", file: uploadedFile });
    }
  }, [hasStoredSignature, loading, mode, onConfirm, toast, uploadedFile]);

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : null)}>
      <DialogContent className="max-w-3xl" aria-describedby="sign-document-modal-desc">
        <DialogHeader>
          <DialogTitle>Firmar documento</DialogTitle>
          <DialogDescription id="sign-document-modal-desc">
            Elige cómo deseas aplicar tu firma como <span className="font-semibold">Elabora</span> antes de guardar los cambios.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="stored" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Firma actual
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <PenLine className="h-4 w-4" /> Dibujar
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Subir imagen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stored" className="mt-4">
            <StoredSignaturePreview signatureUrl={currentSignatureUrl} />
          </TabsContent>

          <TabsContent value="draw" className="mt-4 space-y-4">
            <SignaturePad ref={signatureCanvasRef} onEnd={handleDrawEnd} />
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>Dibuja tu firma directamente con el cursor o con tu dedo en pantallas táctiles.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearDraw}
                className="gap-2 self-start sm:self-auto"
              >
                <X className="h-4 w-4" /> Limpiar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Acepta archivos PNG o JPG de hasta 2MB. La imagen se adaptará al espacio disponible.
              </p>
            </div>
            {uploadedPreview ? (
              <div className="flex h-48 w-full items-center justify-center rounded-lg border bg-background p-4">
                <img
                  src={uploadedPreview}
                  alt="Vista previa de la firma"
                  className="h-full max-h-40 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Selecciona una imagen para ver aquí una vista previa antes de firmar.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Alert variant="warning" className="mt-6">
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Esta firma es <span className="font-semibold">irrevocable</span>. Asegúrate de haber leído el documento antes de confirmarla.
          </AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={cn("gap-2", loading && "cursor-not-allowed")}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Firmando…
              </>
            ) : (
              "Firmar con mi firma"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
