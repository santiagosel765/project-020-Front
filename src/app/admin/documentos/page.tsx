"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocumentSupervision,
  getFirmantes,
  getSupervisionStats,
  type DocumentoRow,
  type SignerSummary,
  type DocumentSupervisionParams,
} from "@/services/documentsService";
import { SignersModal } from "@/components/signers-modal";
import { usePaginationState } from "@/hooks/usePaginationState";
import { pageDebug } from "@/lib/page-debug";

function toUiDocument(d: DocumentoRow): Document {
  const add = d.add_date ?? "";
  const assignedUsers = (d.firmantesResumen && d.firmantesResumen.length
    ? d.firmantesResumen
    : Array.from({ length: 3 }).map((_, i) => ({
        id: `ph-${i}`,
        nombre: "",
        urlFoto: undefined,
        responsabilidad: "",
      })))
    .map((f) => ({
      id: String(f.id),
      name: f.nombre,
      avatar: (f.urlFoto ?? (f as any).avatar ?? null) ?? undefined,
      responsibility: f.responsabilidad,
      department: "",
      employeeCode: "",
    }));
  const anyDoc: any = {
    id: String(d.id ?? ""),
    code: "",
    name: d.titulo ?? "",
    description: d.descripcion ?? "",
    sendDate: add,
    status: (d.estado?.nombre ?? "") as Document["status"],
    businessDays: d.diasTranscurridos ?? 0,
    assignedUsers,
  };
  return anyDoc as Document;
}

const defaultCounts: Record<Document["status"] | "Todos", number> = {
  Todos: 0,
  Pendiente: 0,
  "En Progreso": 0,
  Rechazado: 0,
  Completado: 0,
};

export default function DocumentosPage() {
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [firmantes, setFirmantes] = useState<SignerSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { toast } = useToast();
  const {
    page,
    limit,
    sort,
    search,
    setPage,
    setLimit,
    setSearch,
    toggleSort,
    isUserPagingRef,
  } = usePaginationState({
    defaultLimit: 10,
    defaultSort: "desc",
  });
  const sortOrder: "asc" | "desc" = sort;
  const [searchInput, setSearchInput] = useState(() => search);
  const initialSearchRef = useRef(search);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    initialSearchRef.current = search;
    setSearchInput((current) => (current === search ? current : search));
    isFirstSearchEffect.current = true;
  }, [search]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (isFirstSearchEffect.current) {
        isFirstSearchEffect.current = false;
        if (searchInput === initialSearchRef.current) {
          return;
        }
      }
      setSearch(searchInput);
      if (isUserPagingRef.current) {
        pageDebug("src/app/admin/documentos/page.tsx:101:setPage(skip)", {
          reason: "userPaging",
          from: page,
          to: 1,
          searchInput,
        });
        return;
      }
      pageDebug("src/app/admin/documentos/page.tsx:109:setPage", {
        from: page,
        to: 1,
        searchInput,
      });
      setPage(1);
    }, 300);
    return () => {
      window.clearTimeout(handler);
    };
  }, [searchInput, setPage, setSearch]);

  const documentsQuery = useQuery({
    queryKey: [
      "documents",
      "supervision",
      {
        page,
        limit,
        sort: sortOrder,
        search,
        status: statusFilter,
      },
    ],
    queryFn: async () => {
      const params: DocumentSupervisionParams = {
        page,
        limit,
        sort: sortOrder,
        search,
      };
      if (statusFilter !== "Todos") params.estado = statusFilter;
      const response = await getDocumentSupervision(params);
      return {
        ...response,
        items: response.items.map(toUiDocument),
      };
    },
    keepPreviousData: true,
    retry: false,
  });

  useEffect(() => {
    if (!documentsQuery.error) return;
    toast({
      variant: "destructive",
      title: "Error al cargar documentos",
      description: "No se pudieron obtener los datos de los documentos.",
    });
  }, [documentsQuery.error, toast]);

  const countsQuery = useQuery({
    queryKey: ["documents", "supervision", "stats", { search }],
    queryFn: async () => getSupervisionStats({ search }),
    keepPreviousData: true,
    retry: false,
  });

  const counts = useMemo(() => {
    const resumen = countsQuery.data;
    if (!resumen) return defaultCounts;
    return {
      Todos: resumen.Todos ?? 0,
      Pendiente: resumen.Pendiente ?? 0,
      "En Progreso": resumen["En Progreso"] ?? 0,
      Rechazado: resumen.Rechazado ?? 0,
      Completado: resumen.Completado ?? 0,
    } as Record<Document["status"] | "Todos", number>;
  }, [countsQuery.data]);

  const handleAsignadosClick = async (doc: Document) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      const data = await getFirmantes(Number(doc.id));
      setFirmantes(data);
    } catch {
      toast({
        variant: "destructive",
        title: "Error al cargar firmantes",
        description: "No se pudieron obtener los firmantes.",
      });
      setFirmantes([]);
    } finally {
      setModalLoading(false);
    }
  };

  const isInitialLoading = documentsQuery.isPending && !documentsQuery.data;

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const payload = documentsQuery.data;

  return (
    <div className="h-full">
      <DocumentsTable
        data={payload}
        title="Gestión de Documentos"
        description="Visualice, busque y gestione todos los documentos de la plataforma."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          if (page !== 1) {
            if (isUserPagingRef.current) {
              pageDebug("src/app/admin/documentos/page.tsx:225:setPage(skip)", {
                reason: "userPaging",
                from: page,
                to: 1,
                status: s,
              });
              return;
            }
            pageDebug("src/app/admin/documentos/page.tsx:233:setPage", {
              from: page,
              to: 1,
              status: s,
            });
            setPage(1);
          }
        }}
        sortOrder={sortOrder}
        onSortToggle={() => {
          toggleSort();
        }}
        onAsignadosClick={handleAsignadosClick}
        statusCounts={counts}
        onPageChange={setPage}
        onLimitChange={setLimit}
        loading={documentsQuery.isFetching}
      />
      <SignersModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        firmantes={firmantes}
        loading={modalLoading}
      />
    </div>
  );
}
