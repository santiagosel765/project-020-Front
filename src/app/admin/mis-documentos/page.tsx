"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getByUserStats,
  getDocumentsByUser,
  getFirmantes,
  type AsignacionDTO,
  type DocumentsByUserParams,
} from "@/services/documentsService";
import { getMe } from "@/services/usersService";
import { SignersModal } from "@/components/signers-modal";
import { usePaginationState } from "@/hooks/usePaginationState";

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

const defaultCounts: Record<Document["status"] | "Todos", number> = {
  Todos: 0,
  Pendiente: 0,
  "En Progreso": 0,
  Rechazado: 0,
  Completado: 0,
};

export default function MisDocumentosPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [firmantes, setFirmantes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { toast } = useToast();
  const { page, limit, sort, setPage, setLimit, toggleSort } = usePaginationState({
    defaultLimit: 10,
    defaultSort: "desc",
  });
  const sortOrder: "asc" | "desc" = sort;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setPage, setSearch]);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(),
    retry: false,
  });

  useEffect(() => {
    if (!meQuery.error) return;
    toast({
      variant: "destructive",
      title: "Error al cargar usuario",
      description: "No se pudo obtener la información del usuario.",
    });
  }, [meQuery.error, toast]);

  const userId = useMemo(() => {
    const id = meQuery.data?.id;
    const numeric = Number(id);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }, [meQuery.data?.id]);

  const documentsQuery = useQuery({
    queryKey: [
      "documents",
      "me",
      userId,
      {
        page,
        limit,
        sort: sortOrder,
        search,
        status: statusFilter,
      },
    ],
    enabled: userId != null,
    queryFn: async () => {
      if (!userId) throw new Error("No se encontró el usuario");
      const params: DocumentsByUserParams = {
        page,
        limit,
        sort: sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter !== "Todos") params.estado = statusFilter;
      const response = await getDocumentsByUser(userId, params);
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
    queryKey: ["documents", "me", "stats", userId, { search }],
    enabled: userId != null,
    queryFn: async () => {
      if (!userId) return defaultCounts;
      const resumen = await getByUserStats(userId, { search });
      return resumen;
    },
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

  const isInitialLoading = meQuery.isPending || (documentsQuery.isPending && !documentsQuery.data);

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
  const documents = payload?.items ?? [];
  const total = payload?.total ?? 0;
  const totalPages = payload?.pages ?? 1;
  const currentPage = payload?.page ?? page;
  const hasPrev = payload?.hasPrev ?? currentPage > 1;
  const hasNext = payload?.hasNext ?? currentPage < totalPages;
  const currentLimit = payload?.limit ?? limit;

  return (
    <div className="h-full">
      <DocumentsTable
        items={documents}
        title="Mis Documentos"
        description="Documentos asignados a usted para revisar y firmar."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          if (page !== 1) setPage(1);
        }}
        sortOrder={sortOrder}
        onSortToggle={() => {
          toggleSort();
          setPage(1);
        }}
        onAsignadosClick={handleAsignadosClick}
        statusCounts={counts}
        total={total}
        pages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        page={currentPage}
        limit={currentLimit}
        onPageChange={setPage}
        onLimitChange={(value) => {
          setLimit(value);
          setPage(1);
        }}
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
