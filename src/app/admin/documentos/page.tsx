"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { useServerPagination } from "@/hooks/useServerPagination";

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

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [firmantes, setFirmantes] = useState<SignerSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [counts, setCounts] = useState<
    Record<Document["status"] | "Todos", number>
  >({ Todos: 0, Pendiente: 0, "En Progreso": 0, Rechazado: 0, Completado: 0 });
  const { toast } = useToast();
  const { page, limit, setPage, setLimit, setFromMeta } = useServerPagination();

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit, sort: sortOrder };
      if (search) params.search = search;
      if (statusFilter !== "Todos") params.estado = statusFilter;
      const { items, meta } = await getDocumentSupervision(params);
      setTotal(meta.total ?? 0);
      if (meta.pages > 0 && page > meta.pages) {
        setFromMeta(meta);
        return;
      }
      setDocuments(items.map(toUiDocument));
      setFromMeta(meta);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar documentos",
        description: "No se pudieron obtener los datos de los documentos.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, statusFilter, sortOrder, setFromMeta, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const resumen = await getSupervisionStats({ search });
        setCounts({
          Todos: resumen.Todos ?? 0,
          Pendiente: resumen.Pendiente ?? 0,
          "En Progreso": resumen["En Progreso"] ?? 0,
          Rechazado: resumen.Rechazado ?? 0,
          Completado: resumen.Completado ?? 0,
        });
      } catch {
        /* ignore */
      }
    };
    fetchCounts();
  }, [search]);

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

  if (isLoading) {
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

  return (
    <div className="h-full">
      <DocumentsTable
        documents={documents}
        title="Gestión de Documentos"
        description="Visualice, busque y gestione todos los documentos de la plataforma."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(o) => {
          setSortOrder(o);
          setPage(1);
        }}
        onAsignadosClick={handleAsignadosClick}
        statusCounts={counts}
        dataSource="supervision"
        total={total}
        page={page}
        pageSize={limit}
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

