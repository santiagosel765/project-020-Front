"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
} from "@/services/documentsService";
import { SignersModal } from "@/components/signers-modal";
import { usePaginationState } from "@/hooks/usePaginationState";

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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [firmantes, setFirmantes] = useState<SignerSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { toast } = useToast();
  const { page, limit, sort, setPage, setLimit, setSort } = usePaginationState({ sort: "desc" });
  const sortOrder: "asc" | "desc" = sort === "asc" ? "asc" : "desc";

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      if (page !== 1) setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchInput, setPage]);

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
      const params: Record<string, any> = { page, limit, sort: sortOrder };
      if (search) params.search = search;
      if (statusFilter !== "Todos") params.estado = statusFilter;
      const response = await getDocumentSupervision(params);
      return {
        items: response.items.map(toUiDocument),
        meta: response.meta,
      };
    },
    placeholderData: keepPreviousData,
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

  const documents = documentsQuery.data?.items ?? [];
  const meta = documentsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.pages ?? 1;
  const hasPrev = meta?.hasPrevPage ?? page > 1;
  const hasNext = meta?.hasNextPage ?? page < totalPages;
  const pageSize = meta?.limit ?? limit;

  return (
    <div className="h-full">
      <DocumentsTable
        items={documents}
        title="Gestión de Documentos"
        description="Visualice, busque y gestione todos los documentos de la plataforma."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          if (page !== 1) setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(o) => {
          setSort(o);
        }}
        onAsignadosClick={handleAsignadosClick}
        statusCounts={counts}
        total={total}
        pages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
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
