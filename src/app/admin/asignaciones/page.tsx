"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AssignmentForm, {
  type AssignmentFormSubmitData,
} from "@/components/assignments/AssignmentForm";
import { useToast } from "@/hooks/use-toast";
import { getEmpresas } from "@/services/empresasService";
import { useSession } from "@/lib/session";
import { SignDocumentModal } from "@/components/sign/SignDocumentModal";
import { useSignAndPersist } from "@/hooks/useSignAndPersist";
import type { SignSource } from "@/types/signatures";

export default function AsignacionesPage() {
  const { toast } = useToast();
  const { signatureUrl } = useSession();
  const { createThenSign } = useSignAndPersist();
  const [companies, setCompanies] = useState<Array<{ id: number; nombre: string }>>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [pendingValues, setPendingValues] = useState<AssignmentFormSubmitData | null>(null);
  const pendingPromiseRef = useRef<{
    resolve: () => void;
    reject: (error: unknown) => void;
  } | null>(null);

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

  const clearPendingState = useCallback(() => {
    setSignModalOpen(false);
    setPendingValues(null);
    pendingPromiseRef.current = null;
  }, []);

  const handleSubmit = useCallback(
    async (data: AssignmentFormSubmitData) =>
      new Promise<void>((resolve, reject) => {
        pendingPromiseRef.current = { resolve, reject };
        setPendingValues(data);
        setSignModalOpen(true);
      }),
    [],
  );

  const handleModalConfirm = useCallback(
    async (signSource: SignSource) => {
      if (!pendingValues) return;
      const pending = pendingPromiseRef.current;
      setModalLoading(true);
      try {
        await createThenSign({ formValues: pendingValues, signSource });
        pending?.resolve();
      } catch (error) {
        pending?.reject(error);
      } finally {
        setModalLoading(false);
        clearPendingState();
      }
    },
    [clearPendingState, createThenSign, pendingValues],
  );

  const handleModalClose = useCallback(() => {
    if (modalLoading) return;
    const pending = pendingPromiseRef.current;
    if (pending) {
      pending.reject(new Error("signature-modal-cancelled"));
    }
    clearPendingState();
  }, [clearPendingState, modalLoading]);

  return (
    <div className="container mx-auto h-full -mt-8">
      <AssignmentForm
        mode="create"
        onSubmit={handleSubmit}
        companies={companies}
        companiesLoading={companiesLoading}
      />
      <SignDocumentModal
        open={signModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        loading={modalLoading}
        currentSignatureUrl={signatureUrl ?? undefined}
      />
    </div>
  );
}
