"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getByUserStats,
  getDocumentsByUser,
  getFirmantes,
  type AsignacionDTO,
} from "@/services/documentsService";
import { getMe } from "@/services/usersService";
import { SignersModal } from "@/components/signers-modal";
import { useServerPagination } from "@/hooks/useServerPagination";

function toUiDocument(a: AsignacionDTO): Document {
  const cf = a.cuadro_firma;
  const add = cf.add_date ?? "";
  const srcFirmantes =
    Array.isArray((cf as any).firmantesResumen) && (cf as any).firmantesResumen.length
      ? (cf as any).firmantesResumen
      : Array.isArray((cf as any).cuadro_firma_user)
      ? (cf as any).cuadro_firma_user.map((f: any) => {
          const u = f.user ?? {};
          const foto = u.urlFoto ?? u.url_foto ?? null;
          const nombre = [
            u.primer_nombre,
            u.segundo_name,
            u.tercer_nombre,
            u.primer_apellido,
            u.segundo_apellido,
            u.apellido_casada,
          ]
            .filter(Boolean)
            .join(" ");
          return {
            id: Number(u.id ?? f.user_id ?? 0),
            nombre,
            urlFoto: foto,
            avatar: foto,
            responsabilidad: f.responsabilidad_firma?.nombre ?? "",
          };
        })
      : [];
  const assignedUsers = srcFirmantes.map((f: any) => ({
    id: String(f.id),
    name: f.nombre,
    avatar: (f.urlFoto ?? f.avatar ?? null) ?? undefined,
    responsibility: f.responsabilidad,
    department: "",
    employeeCode: "",
  }));
  const anyDoc: any = {
    id: String(cf.id ?? ""),
    code: cf.codigo ?? "",
    name: cf.titulo ?? "",
    description: cf.descripcion ?? "",
    sendDate: add,
    status: (cf.estado_firma?.nombre ?? "") as Document["status"],
    businessDays: cf.diasTranscurridos ?? 0,
    assignedUsers,
  };
  return anyDoc as Document;
}

export default function MisDocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [firmantes, setFirmantes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [counts, setCounts] = useState<
    Record<Document["status"] | "Todos", number>
  >({ Todos: 0, Pendiente: 0, "En Progreso": 0, Rechazado: 0, Completado: 0 });
  const { toast } = useToast();
  const { page, limit, setPage, setLimit, setFromMeta } = useServerPagination();

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUserId = useCallback(async () => {
    if (userId != null) return userId;
    try {
      const me = await getMe();
      const id = Number(me.id);
      if (Number.isFinite(id)) {
        setUserId(id);
        return id;
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error al cargar usuario",
        description: "No se pudo obtener la información del usuario.",
      });
    }
    return null;
  }, [toast, userId]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const id = await fetchUserId();
      if (!id) {
        setDocuments([]);
        setTotal(0);
        return;
      }
      const params: Record<string, any> = { page, limit, sort: sortOrder };
      if (search) params.search = search;
      if (statusFilter !== "Todos") params.estado = statusFilter;
      const { items, meta } = await getDocumentsByUser(id, params);
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
  }, [fetchUserId, limit, page, search, statusFilter, sortOrder, setFromMeta, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const loadCounts = async () => {
      const id = userId ?? (await fetchUserId());
      if (!id) return;
      try {
        const resumen = await getByUserStats(id, { search });
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
    loadCounts();
  }, [fetchUserId, search, userId]);

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
        title="Mis Documentos"
        description="Documentos asignados a usted para revisar y firmar."
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

