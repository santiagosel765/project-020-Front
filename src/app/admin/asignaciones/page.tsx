"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import AssignmentForm, {
  type AssignmentFormSubmitData,
} from "@/components/assignments/AssignmentForm";
import { useToast } from "@/hooks/use-toast";
import { createCuadroFirma } from "@/services/documentsService";
import api from "@/lib/axiosConfig";
import { useSession } from "@/lib/session";

const extractItems = (payload: any): any[] => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.items)) return payload.items;
  const data = payload.data ?? payload.result ?? payload.body;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.documentos)) return data.documentos;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const pickId = (items: any[], currentUserId?: number): number | undefined => {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const mine = Number.isFinite(currentUserId)
    ? items.find((item) => Number(item?.usuarioCreacion?.id) === currentUserId)
    : undefined;
  const candidate = mine ?? items[0];
  const rawId = candidate?.id;
  const numericId = typeof rawId === "number" ? rawId : Number(rawId);
  return Number.isFinite(numericId) ? (numericId as number) : undefined;
};

export default function AsignacionesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { me } = useSession();

  const handleSubmit = useCallback(
    async (data: AssignmentFormSubmitData) => {
      if (!data.pdfFile) {
        toast({
          variant: "destructive",
          title: "Falta el archivo PDF",
          description: "Cargue un PDF para continuar.",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", data.pdfFile);
      formData.append("responsables", JSON.stringify(data.responsables));

      const meta = {
        titulo: data.title,
        descripcion: data.description,
        version: data.version,
        codigo: data.code,
        empresa_id: data.companyId || 1,
        createdBy: me?.id,
      } as Record<string, unknown>;

      if (data.observaciones) {
        meta.observaciones = data.observaciones;
      }

      Object.entries(meta).forEach(([key, value]) => {
        if (value != null && value !== "") {
          formData.append(key, String(value));
        }
      });

      try {
        await createCuadroFirma(formData);

        let nextId: number | undefined;
        const currentUserId = Number(me?.id);

        const fetchLatestId = async (limit: number): Promise<number | undefined> => {
          const { data } = await api.get(
            "/documents/cuadro-firmas/documentos/supervision",
            { params: { page: 1, limit, sort: "desc" } },
          );
          return pickId(extractItems(data), currentUserId);
        };

        try {
          nextId = await fetchLatestId(1);
          if (!nextId) {
            nextId = await fetchLatestId(5);
          }
        } catch (lookupError) {
          console.error("Document lookup error:", lookupError);
        }

        if (typeof nextId === "number") {
          router.replace(`/documento/${nextId}`);
          return;
        }

        toast({
          title: "Documento enviado",
          description: "No se pudo obtener el ID automáticamente. Revisa la lista de supervisión.",
        });
      } catch (error: any) {
        const status = error?.response?.status;
        let message = error?.response?.data?.message || error?.message || "";
        if (Array.isArray(message)) message = message.join(" | ");
        const m = String(message).toLowerCase();

        console.error("Document creation error:", error);

        if (status === 409 || m.includes("código") || m.includes("codigo") || m.includes("conflictexception")) {
          toast({
            variant: "destructive",
            title: "Código en uso",
            description: "Ya existe un documento con ese código. Cambia el código y vuelve a intentar.",
          });
          return;
        }

        if (
          status === 500 ||
          m.includes("server has closed the connection") ||
          m.includes("prisma") ||
          m.includes("base de datos")
        ) {
          toast({
            variant: "destructive",
            title: "Conexión a BD inestable",
            description: "Vuelve a intentar en unos segundos.",
          });
          return;
        }

        toast({
          variant: "destructive",
          title: "Error de creación",
          description: message || "Hubo un problema al crear el documento.",
        });
      }
    },
    [me?.id, router, toast],
  );

  return (
    <div className="container mx-auto h-full -mt-8">
      <AssignmentForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
