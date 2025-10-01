"use client";

import { useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axiosConfig";
import type { AssignmentFormSubmitData } from "@/components/assignments/AssignmentForm";
import { createCuadroFirma, updateCuadroFirma, updateDocumentoAsignacion } from "@/services/documentsService";
import type { CuadroFirmaUpdatePayload } from "@/types/documents";

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

const resolveCreatedId = (created: any): number | null => {
  const candidates = [
    created?.id,
    created?.cuadroFirmaId,
    created?.cuadro_firma?.id,
    created?.cuadroFirma?.id,
    created?.documento?.id,
    created?.document?.id,
  ];

  for (const value of candidates) {
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numeric)) {
      return numeric as number;
    }
  }

  return null;
};

const normalizeMessage = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(" | ");
  }
  if (value == null) return "";
  return String(value);
};

type UpdateAssignmentArgs = {
  id: number;
  formValues: AssignmentFormSubmitData;
};

export function useSignAndPersist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { me } = useSession();

  const currentUserId = useMemo(() => {
    const raw = me?.id;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }, [me?.id]);

  const resolvedUserId = useMemo(() => {
    const raw = me?.id;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : raw;
    }
    return currentUserId ?? null;
  }, [currentUserId, me?.id]);

  const fetchCreatedId = useCallback(
    async () => {
      try {
        const { data } = await api.get(
          "/documents/cuadro-firmas/documentos/supervision",
          { params: { page: 1, limit: 5, sort: "desc" } },
        );
        return pickId(extractItems(data), currentUserId);
      } catch (error) {
        console.error("Document lookup error:", error);
        return undefined;
      }
    },
    [currentUserId],
  );

  const createAssignment = useCallback(
    async (formValues: AssignmentFormSubmitData) => {
      if (!formValues.pdfFile) {
        throw new Error("PDF requerido");
      }

      const formData = new FormData();
      formData.append("file", formValues.pdfFile);
      formData.append("responsables", JSON.stringify(formValues.responsables));

      const meta: Record<string, unknown> = {
        titulo: formValues.title,
        descripcion: formValues.description,
        version: formValues.version,
        codigo: formValues.code,
        empresa_id: formValues.empresaId ?? 1,
        createdBy: resolvedUserId ?? null,
      };

      if (formValues.observaciones) {
        meta.observaciones = formValues.observaciones;
      }

      Object.entries(meta).forEach(([key, value]) => {
        if (value != null && value !== "") {
          formData.append(key, String(value));
        }
      });

      let createdId: number | undefined;

      try {
        const created = await createCuadroFirma(formData);
        createdId = resolveCreatedId(created) ?? undefined;
        if (!createdId) {
          createdId = await fetchCreatedId();
        }
      } catch (error: any) {
        const status = error?.response?.status ?? error?.status;
        let message = normalizeMessage(
          error?.response?.data?.message ?? error?.message ?? "",
        );
        const lowercase = message.toLowerCase();

        console.error("Document creation error:", error);

        if (
          status === 409 ||
          lowercase.includes("código") ||
          lowercase.includes("codigo") ||
          lowercase.includes("conflictexception")
        ) {
          toast({
            variant: "destructive",
            title: "Código en uso",
            description:
              "Ya existe un documento con ese código. Cambia el código y vuelve a intentar.",
          });
          throw error;
        }

        if (
          status === 500 ||
          lowercase.includes("server has closed the connection") ||
          lowercase.includes("prisma") ||
          lowercase.includes("base de datos")
        ) {
          toast({
            variant: "destructive",
            title: "Conexión a BD inestable",
            description: "Vuelve a intentar en unos segundos.",
          });
          throw error;
        }

        message = message || "No se pudo crear el documento.";
        toast({ variant: "destructive", title: "Error", description: message });
        throw error;
      }

      if (!createdId) {
        toast({
          title: "Documento creado",
          description:
            "No se pudo obtener el ID automáticamente. Revisa la lista de supervisión.",
        });
        return null;
      }

      return createdId ?? null;
    },
    [fetchCreatedId, resolvedUserId, toast],
  );

  const updateAssignment = useCallback(
    async ({ id, formValues }: UpdateAssignmentArgs) => {
      const payload: CuadroFirmaUpdatePayload & { empresa_id?: number | null } = {
        titulo: formValues.title,
        descripcion: formValues.description,
        version: formValues.version,
        codigo: formValues.code,
        empresaId: formValues.empresaId ?? null,
        responsables: formValues.responsables,
        idUser: resolvedUserId ?? null,
      };

      if (formValues.empresaId != null) {
        payload.empresa_id = formValues.empresaId;
      } else {
        payload.empresa_id = null;
      }

      if (formValues.observaciones) {
        payload.observaciones = formValues.observaciones;
      }

      try {
        await updateCuadroFirma(id, payload);

        if (formValues.hasFileChange && formValues.pdfFile) {
          await updateDocumentoAsignacion(id, {
            file: formValues.pdfFile,
            idUser: resolvedUserId ?? undefined,
            observaciones: formValues.observaciones,
          });
        }

        toast({
          title: "Actualizado",
          description: "La asignación se actualizó correctamente.",
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["documents"] }),
          queryClient.invalidateQueries({ queryKey: ["documents", "supervision"] }),
          queryClient.invalidateQueries({ queryKey: ["documents", "supervision", "stats"] }),
          queryClient.invalidateQueries({ queryKey: ["documents", "me"] }),
        ]);
      } catch (error: any) {
        console.error("Error updating assignment", error);
        const status = error?.response?.status ?? error?.status;
        const rawMessage =
          error?.response?.data?.message ||
          error?.message ||
          "No se pudo actualizar la asignación.";
        const message = String(rawMessage);

        if (
          status === 500 &&
          typeof rawMessage === "string" &&
          rawMessage.toLowerCase().includes("cuadro_firma_estado_historial.create")
        ) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              "No se pudo registrar historial; intenta de nuevo o contacta soporte",
          });
          throw error;
        }

        toast({ variant: "destructive", title: "Error", description: message });
        throw error;
      }
    },
    [queryClient, resolvedUserId, toast],
  );

  return { createAssignment, updateAssignment };
}
