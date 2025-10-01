"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AssignmentForm, {
  type AssignmentFormSubmitData,
} from "@/components/assignments/AssignmentForm";
import { useToast } from "@/hooks/use-toast";
import { getEmpresas } from "@/services/empresasService";
import { useSession } from "@/lib/session";
import { SignDialog } from "@/components/sign-dialog";
import { useSignAndPersist } from "@/hooks/useSignAndPersist";
import {
  getFirmantes,
  type SignerFull,
  type SignerSummary,
} from "@/services/documentsService";
import { fullName } from "@/lib/avatar";

type SignContext = {
  documentId: number;
  firmantes: SignerFull[];
};

const mapSignerSummariesToFull = (items: SignerSummary[]): SignerFull[] =>
  items.map((f) => {
    const foto = f.user.urlFoto ?? f.user.url_foto ?? f.user.avatar ?? f.user.foto_perfil ?? null;
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

export default function AsignacionesPage() {
  const { toast } = useToast();
  const { me } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { createAssignment } = useSignAndPersist();

  const [companies, setCompanies] = useState<Array<{ id: number; nombre: string }>>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signContext, setSignContext] = useState<SignContext | null>(null);

  const pendingPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const signedRef = useRef(false);
  const signContextRef = useRef<SignContext | null>(null);

  useEffect(() => {
    signContextRef.current = signContext;
  }, [signContext]);

  useEffect(() => {
    let active = true;
    setCompaniesLoading(true);
    (async () => {
      try {
        const data = await getEmpresas({ activo: true });
        if (!active) return;
        setCompanies(data.items ?? []);
      } catch (error) {
        console.error("Error fetching companies", error);
        if (active) {
          toast({
            variant: "destructive",
            title: "Error al cargar empresas",
            description: "No fue posible obtener la lista de empresas.",
          });
        }
      } finally {
        if (active) {
          setCompaniesLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [toast]);

  const currentUserId = useMemo(() => {
    const raw = me?.id;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }, [me?.id]);

  const invalidateDocuments = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ["documents"] }),
      queryClient.invalidateQueries({ queryKey: ["documents", "supervision"] }),
      queryClient.invalidateQueries({ queryKey: ["documents", "supervision", "stats"] }),
      queryClient.invalidateQueries({ queryKey: ["documents", "me"] }),
    ]);
  }, [queryClient]);

  const handleSubmit = useCallback(
    async (data: AssignmentFormSubmitData) =>
      new Promise<void>((resolve, reject) => {
        pendingPromiseRef.current = { resolve, reject };
        void (async () => {
          try {
            const createdId = await createAssignment(data);
            if (!createdId) {
              pendingPromiseRef.current = null;
              resolve();
              return;
            }

            let firmantesSummary: SignerSummary[];
            try {
              firmantesSummary = await getFirmantes(createdId);
            } catch (error) {
              console.error("Error fetching signers", error);
              toast({
                variant: "destructive",
                title: "Firma pendiente",
                description: "No se pudieron obtener los firmantes. Completa la firma en el detalle.",
              });
              void invalidateDocuments();
              router.push(`/documento/${createdId}?tab=cuadro`);
              pendingPromiseRef.current = null;
              resolve();
              return;
            }

            const firmantes = mapSignerSummariesToFull(firmantesSummary);

            if (currentUserId == null) {
              toast({
                variant: "destructive",
                title: "Usuario no identificado",
                description:
                  "El documento se creó, pero no se pudo determinar el usuario para firmar automáticamente.",
              });
              void invalidateDocuments();
              router.push(`/documento/${createdId}?tab=cuadro`);
              pendingPromiseRef.current = null;
              resolve();
              return;
            }

            signedRef.current = false;
            setSignContext({ documentId: createdId, firmantes });
            setSignOpen(true);
          } catch (error) {
            pendingPromiseRef.current?.reject(error);
            pendingPromiseRef.current = null;
          }
        })();
      }),
    [createAssignment, currentUserId, invalidateDocuments, router, toast],
  );

  const handleSignDialogSigned = useCallback(async () => {
    const context = signContextRef.current;
    if (!context) return;
    signedRef.current = true;
    await invalidateDocuments().catch(() => undefined);
    router.push(`/documento/${context.documentId}?tab=cuadro`);
    const pending = pendingPromiseRef.current;
    if (pending) {
      pending.resolve();
      pendingPromiseRef.current = null;
    }
  }, [invalidateDocuments, router]);

  const handleSignDialogClose = useCallback(() => {
    setSignOpen(false);
    const context = signContextRef.current;
    const pending = pendingPromiseRef.current;

    if (signedRef.current) {
      signedRef.current = false;
      setSignContext(null);
      return;
    }

    if (context) {
      toast({
        variant: "destructive",
        title: "Firma pendiente",
        description: "Puedes completar la firma desde el detalle del documento.",
      });
      void invalidateDocuments();
      router.push(`/documento/${context.documentId}?tab=cuadro`);
      if (pending) {
        pending.resolve();
        pendingPromiseRef.current = null;
      }
      setSignContext(null);
      return;
    }

    if (pending) {
      pending.reject(new Error("signature-dialog-cancelled"));
      pendingPromiseRef.current = null;
    }
    setSignContext(null);
  }, [invalidateDocuments, router, toast]);

  return (
    <div className="container mx-auto h-full -mt-8">
      <AssignmentForm
        mode="create"
        onSubmit={handleSubmit}
        companies={companies}
        companiesLoading={companiesLoading}
      />
      {signContext && currentUserId != null && (
        <SignDialog
          open={signOpen}
          onClose={handleSignDialogClose}
          cuadroFirmaId={signContext.documentId}
          firmantes={signContext.firmantes}
          currentUserId={currentUserId}
          onSigned={handleSignDialogSigned}
        />
      )}
    </div>
  );
}
