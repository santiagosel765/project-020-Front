"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AssignmentForm, {
  type AssignmentFormInitialValues,
  type AssignmentFormSubmitData,
} from "@/components/assignments/AssignmentForm";
import { useToast } from "@/hooks/use-toast";
import {
  getCuadroFirmaDetalle,
  getFirmantes,
  type SignerFull,
  type SignerSummary,
} from "@/services/documentsService";
import { getEmpresas } from "@/services/empresasService";
import { useSession } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";
import { fullName } from "@/lib/avatar";
import { SignDialog } from "@/components/sign-dialog";
import { useSignAndPersist } from "@/hooks/useSignAndPersist";

type NormalizedResponsibility = "ELABORA" | "REVISA" | "APRUEBA" | "ENTERADO" | null;

const normalizeResponsibility = (value?: string | null): NormalizedResponsibility => {
  const normalized = value?.toUpperCase?.().trim();
  if (!normalized) return null;
  if (normalized.includes("ELAB")) return "ELABORA";
  if (normalized.includes("REV")) return "REVISA";
  if (normalized.includes("APR")) return "APRUEBA";
  if (normalized.includes("ENT")) return "ENTERADO";
  return null;
};

const getPdfName = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").pop();
    return last ? decodeURIComponent(last) : null;
  } catch {
    const last = url.split("/").pop();
    return last ?? null;
  }
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getRespId = (x: any): number | null =>
  toNumber(x?.responsabilidadId ?? x?.responsabilidad_id ?? x?.responsabilidad ?? null);

const getUserId = (value: any): number | null => {
  if (typeof value === "number" || typeof value === "string") {
    return toNumber(value);
  }
  return toNumber(
    value?.userId ??
      value?.usuarioId ??
      value?.idUsuario ??
      value?.usuario_id ??
      value?.usuario?.id ??
      value?.user?.id ??
      value?.id,
  );
};

const mapResponsables = (
  detalle: any,
  firmantes: SignerSummary[],
): {
  responsables: NonNullable<AssignmentFormInitialValues["responsables"]>;
  elaboraId: number | null;
} => {
  const byUser = new Map<number, { responsabilidadId: number | null; responsabilidad: NormalizedResponsibility }>();

  const ensureEntry = (uid: number) => {
    if (!byUser.has(uid)) {
      byUser.set(uid, { responsabilidadId: null, responsabilidad: null });
    }
    return byUser.get(uid)!;
  };

  const assignEntry = (
    payload: any,
    fallback: NormalizedResponsibility,
  ): number | null => {
    const uid = getUserId(payload);
    if (uid == null) return null;
    const entry = ensureEntry(uid);
    const respId = getRespId(payload);
    const responsibilityName = normalizeResponsibility(
      typeof payload?.responsabilidadNombre === "string"
        ? payload?.responsabilidadNombre
        : typeof payload?.responsabilidad_nombre === "string"
        ? payload?.responsabilidad_nombre
        : typeof payload?.responsabilidad?.nombre === "string"
        ? payload?.responsabilidad?.nombre
        : typeof payload?.responsabilidad === "string"
        ? payload?.responsabilidad
        : null,
    );

    byUser.set(uid, {
      responsabilidadId: respId ?? entry.responsabilidadId ?? null,
      responsabilidad: responsibilityName ?? entry.responsabilidad ?? fallback,
    });
    return uid;
  };

  const addList = (list: any, fallback: NormalizedResponsibility) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => assignEntry(item, fallback));
  };

  let elaboraId: number | null = null;
  const responsablesDetalle = detalle?.responsables ?? {};

  if (responsablesDetalle?.elabora) {
    const uid = assignEntry(responsablesDetalle.elabora, "ELABORA");
    if (uid != null) {
      elaboraId = uid;
    }
  }

  addList(responsablesDetalle?.revisa, "REVISA");
  addList(responsablesDetalle?.aprueba, "APRUEBA");
  addList(responsablesDetalle?.enterado, "ENTERADO");

  const responsables: NonNullable<AssignmentFormInitialValues["responsables"]> = [];

  firmantes.forEach((firmante) => {
    const uid = getUserId(firmante.user);
    if (uid == null) return;

    const nombre = fullName(firmante.user) || firmante.user.correo_institucional || "Usuario";
    const normalizedResponsibility = normalizeResponsibility(firmante.responsabilidad_firma?.nombre);
    const stored = ensureEntry(uid);

    if (!stored.responsabilidad && normalizedResponsibility) {
      byUser.set(uid, {
        responsabilidadId: stored.responsabilidadId,
        responsabilidad: normalizedResponsibility,
      });
    }

    const current = byUser.get(uid) ?? { responsabilidadId: null, responsabilidad: null };

    if (current.responsabilidad === "ELABORA") {
      elaboraId = elaboraId ?? uid;
    }

    const userData = firmante.user ? { ...firmante.user } : {};
    if (userData && typeof userData === "object") {
      if (userData.id == null) {
        (userData as any).id = uid;
      }
      if (userData.posicionNombre == null && userData.posicion?.nombre) {
        (userData as any).posicionNombre = userData.posicion.nombre;
      }
      if (userData.gerenciaNombre == null && userData.gerencia?.nombre) {
        (userData as any).gerenciaNombre = userData.gerencia.nombre;
      }
      if ((userData as any).nombre == null && typeof nombre === "string") {
        (userData as any).nombre = nombre;
      }
    }

    responsables.push({
      id: uid,
      nombre,
      responsabilidad: current.responsabilidad,
      responsabilidadId: current.responsabilidadId,
      user: userData,
    });
  });

  return { responsables, elaboraId };
};

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

export default function AssignmentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isLoading: sessionLoading, me } = useSession();
  const { updateAssignment } = useSignAndPersist();

  const [initialValues, setInitialValues] = useState<AssignmentFormInitialValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: number; nombre: string }>>([]);
  const [elaboraAlreadySigned, setElaboraAlreadySigned] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signContext, setSignContext] = useState<SignContext | null>(null);
  const pendingPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const signedRef = useRef(false);
  const signContextRef = useRef<SignContext | null>(null);

  const documentId = useMemo(() => {
    const rawId = params?.id;
    if (!rawId) return null;
    const parsed = Number(rawId);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }, [params?.id]);

  useEffect(() => {
    signContextRef.current = signContext;
  }, [signContext]);

  const currentUserId = useMemo(() => toNumber(me?.id), [me?.id]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAdmin) {
      router.replace("/403");
    }
  }, [isAdmin, router, sessionLoading]);

  useEffect(() => {
    if (sessionLoading) return;
    if (isAdmin && documentId == null) {
      setLoading(false);
      setNotFound(true);
    }
  }, [documentId, isAdmin, sessionLoading]);

  useEffect(() => {
    if (!isAdmin || !documentId) return;

    let mounted = true;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const [detalle, firmantes, empresas] = await Promise.all([
          getCuadroFirmaDetalle(documentId),
          getFirmantes(documentId),
          getEmpresas({ activo: true }).catch((error) => {
            console.error("Error fetching companies", error);
            if (mounted) {
              toast({
                variant: "destructive",
                title: "Error al cargar empresas",
                description: "No fue posible obtener la lista de empresas.",
              });
            }
            return { items: [], total: 0 } as { items: { id: number; nombre: string }[]; total: number };
          }),
        ]);

        if (!mounted) return;

        const { responsables, elaboraId } = mapResponsables(detalle, firmantes);

        const elaboraFirmante = firmantes.find((firmante) =>
          normalizeResponsibility(firmante.responsabilidad_firma?.nombre) === "ELABORA",
        );
        if (mounted) {
          setElaboraAlreadySigned(Boolean(elaboraFirmante?.estaFirmado));
        }

        setCompanies(empresas?.items ?? []);
        const rawEmpresaId =
          detalle?.empresa_id ??
          detalle?.empresaId ??
          detalle?.empresa?.id ??
          detalle?.empresa?.empresa_id ??
          null;
        const empresaIdValue = toNumber(rawEmpresaId);

        const empresaNombreValue =
          typeof detalle?.empresa?.nombre === "string" && detalle.empresa.nombre.trim() !== ""
            ? detalle.empresa.nombre
            : typeof detalle?.empresa_nombre === "string" && detalle.empresa_nombre.trim() !== ""
            ? detalle.empresa_nombre
            : typeof detalle?.empresaNombre === "string" && detalle.empresaNombre.trim() !== ""
            ? detalle.empresaNombre
            : null;

        setInitialValues({
          title: detalle.titulo,
          description: detalle.descripcion ?? "",
          version: detalle.version ?? "",
          code: detalle.codigo ?? "",
          empresaId: empresaIdValue ?? null,
          empresaNombre: empresaNombreValue,
          pdfUrl: detalle.urlDocumento || detalle.urlCuadroFirmasPDF,
          pdfName: getPdfName(detalle.urlDocumento || detalle.urlCuadroFirmasPDF),
          responsables,
          elaboraUserId: elaboraId ?? Number(me?.id) ?? null,
        });
      } catch (error) {
        console.error("Error loading assignment detail", error);
        if (!mounted) return;
        setNotFound(true);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la asignación solicitada.",
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [documentId, isAdmin, me?.id, toast]);

  const handleSubmit = useCallback(
    async (data: AssignmentFormSubmitData) => {
      if (!documentId) return;

      const elaboraSigner = data.signatories.find((signer) => signer.responsibility === "ELABORA");
      const nextElaboraId = toNumber(elaboraSigner?.id);
      const isElabora =
        currentUserId != null && nextElaboraId != null && currentUserId === nextElaboraId;
      const alreadySignedForUser =
        isElabora && initialValues?.elaboraUserId === nextElaboraId ? elaboraAlreadySigned : false;

      const performUpdate = async () => {
        await updateAssignment({ id: documentId, formValues: data });
      };

      if (!isElabora || alreadySignedForUser) {
        await performUpdate();
        router.push(`/documento/${documentId}?tab=cuadro`);
        return;
      }

      return new Promise<void>((resolve, reject) => {
        pendingPromiseRef.current = { resolve, reject };
        void (async () => {
          try {
            await performUpdate();

            let firmantesSummary: SignerSummary[];
            try {
              firmantesSummary = await getFirmantes(documentId);
            } catch (error) {
              console.error("Error fetching signers", error);
              toast({
                variant: "destructive",
                title: "Firma pendiente",
                description: "No se pudieron obtener los firmantes. Completa la firma en el detalle.",
              });
              router.push(`/documento/${documentId}?tab=cuadro`);
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
                  "La asignación se actualizó, pero no se pudo determinar el usuario para firmar.",
              });
              router.push(`/documento/${documentId}?tab=cuadro`);
              pendingPromiseRef.current = null;
              resolve();
              return;
            }

            signedRef.current = false;
            setSignContext({ documentId, firmantes });
            setSignOpen(true);
          } catch (error) {
            pendingPromiseRef.current?.reject(error);
            pendingPromiseRef.current = null;
          }
        })();
      });
    },
    [
      documentId,
      elaboraAlreadySigned,
      initialValues?.elaboraUserId,
      updateAssignment,
      router,
      toast,
      currentUserId,
    ],
  );

  const handleSignDialogSigned = useCallback(async () => {
    const context = signContextRef.current;
    if (!context) return;
    signedRef.current = true;
    router.push(`/documento/${context.documentId}?tab=cuadro`);
    const pending = pendingPromiseRef.current;
    if (pending) {
      pending.resolve();
      pendingPromiseRef.current = null;
    }
  }, [router]);

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
  }, [router, toast]);

  if (sessionLoading) {
    return (
      <div className="container mx-auto h-full -mt-8">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto h-full -mt-8 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (notFound || !initialValues) {
    return (
      <div className="container mx-auto h-full -mt-8 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No se encontró la asignación solicitada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-full -mt-8">
      <AssignmentForm
        mode="edit"
        initialValues={initialValues}
        companies={companies}
        onSubmit={handleSubmit}
        submitLabel="Guardar Cambios"
        title="Editar asignación"
        description="Actualiza los metadatos, responsables y archivo del documento."
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
