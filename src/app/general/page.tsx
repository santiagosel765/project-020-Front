"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import type { PageEnvelope } from "@/lib/pagination";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getByUserStats,
  getDocumentsByUser,
  type AsignacionDTO,
  type DocumentsByUserParams,
} from "@/services/documentsService";
import { useSession } from "@/lib/session";
import { usePaginationState } from "@/hooks/usePaginationState";

type StatusCounts = Record<Document["status"] | "Todos", number>;

const defaultCounts: StatusCounts = {
  Todos: 0,
  Pendiente: 0,
  "En Progreso": 0,
  Rechazado: 0,
  Completado: 0,
};

function toUiDocument(asignacion: AsignacionDTO): Document {
  const cf: any = asignacion?.cuadro_firma ?? {};
  const addDate = cf.add_date ?? cf.addDate ?? "";
  const rawFirmantes = Array.isArray(cf.firmantesResumen)
    ? cf.firmantesResumen
    : Array.isArray(cf.cuadro_firma_user)
    ? cf.cuadro_firma_user.map((f: any) => {
        const u = f.user ?? {};
        const foto = u.urlFoto ?? u.url_foto ?? u.foto_perfil ?? null;
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

  const assignedUsers = rawFirmantes.map((f: any) => ({
    id: String(f.id ?? ""),
    name: f.nombre ?? "",
    avatar: (f.urlFoto ?? f.avatar ?? null) ?? undefined,
    responsibility: f.responsabilidad ?? "",
    department: "",
    employeeCode: "",
  }));

  const document: any = {
    id: String(cf.id ?? ""),
    code: cf.codigo ?? "",
    name: cf.titulo ?? "",
    description: cf.descripcion ?? "",
    sendDate: addDate,
    lastStatusChangeDate: addDate,
    status: (cf.estado_firma?.nombre ?? "") as Document["status"],
    businessDays: cf.diasTranscurridos ?? 0,
    assignedUsers,
  };

  return document as Document;
}

export default function GeneralPage() {
  const { me, isLoading: sessionLoading, error: sessionError } = useSession();
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
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [searchInput, setSearchInput] = useState(() => search);
  const initialSearchRef = useRef(search);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    if (!sessionError) return;
    toast({
      variant: "destructive",
      title: "Error al cargar usuario",
      description: "No se pudo obtener la información del usuario.",
    });
  }, [sessionError, toast]);

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
        return;
      }
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchInput, setPage, setSearch, isUserPagingRef]);

  const userId = useMemo(() => {
    const id = me?.id;
    const numeric = Number(id);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
  }, [me?.id]);

  const trimmedSearch = typeof search === "string" ? search.trim() : "";

  const documentsQuery = useQuery({
    queryKey: [
      "general-documents",
      userId,
      {
        page,
        limit,
        sort: sortOrder,
        search: trimmedSearch,
        status: statusFilter,
      },
    ],
    enabled: userId != null,
    keepPreviousData: true,
    retry: false,
    queryFn: async () => {
      if (!userId) {
        return {
          items: [] as Document[],
          page,
          limit,
          sort: sortOrder,
          total: 0,
          pages: 1,
          hasPrev: false,
          hasNext: false,
        } satisfies PageEnvelope<Document>;
      }

      const params: DocumentsByUserParams = {
        page,
        limit,
        sort: sortOrder,
      };

      if (trimmedSearch.length > 0) {
        params.search = trimmedSearch;
      }
      if (statusFilter !== "Todos") {
        params.estado = statusFilter;
      }

      const response = await getDocumentsByUser(userId, params);
      return {
        ...response,
        items: response.items.map(toUiDocument),
      } satisfies PageEnvelope<Document>;
    },
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
    queryKey: ["general-documents", "stats", userId, { search: trimmedSearch }],
    enabled: userId != null,
    keepPreviousData: true,
    retry: false,
    queryFn: async () => {
      if (!userId) {
        return defaultCounts;
      }

      const params = trimmedSearch.length > 0 ? { search: trimmedSearch } : undefined;
      const resumen = await getByUserStats(userId, params);
      return {
        Todos: resumen.Todos ?? 0,
        Pendiente: resumen.Pendiente ?? 0,
        "En Progreso": resumen["En Progreso"] ?? 0,
        Rechazado: resumen.Rechazado ?? 0,
        Completado: resumen.Completado ?? 0,
      } satisfies StatusCounts;
    },
  });

  const statusCounts = useMemo(() => {
    return (countsQuery.data as StatusCounts | undefined) ?? defaultCounts;
  }, [countsQuery.data]);

  const isLoading = sessionLoading || documentsQuery.isLoading;

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

  const tableData: PageEnvelope<Document> =
    (documentsQuery.data as PageEnvelope<Document> | undefined) ?? {
      items: [] as Document[],
      total: 0,
      pages: 1,
      page,
      limit,
      sort: sortOrder,
      hasPrev: false,
      hasNext: false,
    };

  const handleStatusChange = (value: Document["status"] | "Todos") => {
    setStatusFilter(value);
    if (page !== 1) {
      setPage(1);
    }
  };

  return (
    <div className="h-full">
      <DocumentsTable
        data={tableData}
        title="Mis Documentos"
        description="Documentos asignados a usted para revisar y firmar."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        sortOrder={sortOrder}
        onSortToggle={toggleSort}
        statusCounts={statusCounts}
        onPageChange={setPage}
        onLimitChange={setLimit}
        loading={documentsQuery.isFetching}
      />
    </div>
  );
}
