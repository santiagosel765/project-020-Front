"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocumentsByUser,
  getFirmantes,
  type AsignacionDTO,
  type DocumentsByUserParams,
} from "@/services/documentsService";
import { getMe } from "@/services/usersService";
import { SignersModal } from "@/components/signers-modal";
import { usePaginationState } from "@/hooks/usePaginationState";
import { pageDebug } from "@/lib/page-debug";
import {
  MySignFilter,
  StatusFilter,
  mySignFilterFromQuery,
  mySignFilterToQuery,
  statusFilterFromQuery,
  statusFilterToQuery,
  statusFilterToStatusName,
} from "@/lib/document-filters";

function toUiDocument(a: AsignacionDTO): Document {
  const cf = a.cuadro_firma;
  const add = cf.add_date ?? "";
  const signatureEntries = Array.isArray(cf?.cuadro_firma_user)
    ? (cf.cuadro_firma_user as any[])
    : [];
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
    signatureEntries,
  };
  return anyDoc as Document;
}

export default function MisDocumentosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get("status");
  const mySignParam = searchParams?.get("mysign");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    statusFilterFromQuery(statusParam),
  );
  const [mySignFilter, setMySignFilter] = useState<MySignFilter>(() =>
    mySignFilterFromQuery(mySignParam),
  );
  const [firmantes, setFirmantes] = useState<any[]>([]);
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
    const next = statusFilterFromQuery(statusParam);
    setStatusFilter((prev) => (prev === next ? prev : next));
  }, [statusParam]);

  useEffect(() => {
    const next = mySignFilterFromQuery(mySignParam);
    setMySignFilter((prev) => (prev === next ? prev : next));
  }, [mySignParam]);

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
        pageDebug("src/app/admin/mis-documentos/page.tsx:120:setPage(skip)", {
          reason: "userPaging",
          from: page,
          to: 1,
          searchInput,
        });
        return;
      }
      pageDebug("src/app/admin/mis-documentos/page.tsx:128:setPage", {
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

  const updateFilterParams = (nextStatus: StatusFilter, nextMySign: MySignFilter) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("status", statusFilterToQuery(nextStatus));
    params.set("mysign", mySignFilterToQuery(nextMySign));
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
        search,
      };
      const statusName = statusFilterToStatusName(statusFilter);
      if (statusName) params.estado = statusName;
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

  return (
    <div className="h-full">
      <DocumentsTable
        data={payload}
        title="Mis Documentos"
        description="Documentos asignados a usted para revisar y firmar."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(next) => {
          setStatusFilter(next);
          pageDebug("src/app/admin/mis-documentos/page.tsx:286:updateFilters", {
            fromStatus: statusFilter,
            toStatus: next,
            mySign: mySignFilter,
          });
          updateFilterParams(next, mySignFilter);
        }}
        mySignFilter={mySignFilter}
        onMySignFilterChange={(next) => {
          setMySignFilter(next);
          pageDebug("src/app/admin/mis-documentos/page.tsx:296:updateMySign", {
            from: mySignFilter,
            to: next,
            status: statusFilter,
          });
          updateFilterParams(statusFilter, next);
        }}
        sortOrder={sortOrder}
        onSortToggle={() => {
          toggleSort();
        }}
        onAsignadosClick={handleAsignadosClick}
        onPageChange={setPage}
        onLimitChange={setLimit}
        currentUserId={userId}
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
