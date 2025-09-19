"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupervisionTable } from "@/components/supervision-table";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getDocumentSupervision,
  getSupervisionStats,
  type DocumentoRow,
  type SupervisionDoc,
  type DocEstado,
  type DocumentSupervisionParams,
} from '@/services/documentsService';
import { usePaginationState } from '@/hooks/usePaginationState';

const toSupervisionDoc = (d: DocumentoRow): SupervisionDoc => {
  const x = d ?? (d as any)?.cuadro_firma ?? {};
  return {
    id: Number(x.id ?? 0),
    titulo: x.titulo ?? '',
    descripcion: x.descripcion ?? null,
    codigo: x.codigo ?? null,
    version: x.version ?? null,
    addDate: x.add_date ?? x.addDate ?? null,
    estado: (x?.estado_firma?.nombre ?? x?.estado?.nombre ?? '') as DocEstado,
    empresa: x.empresa ?? null,
    diasTranscurridos: x.diasTranscurridos ?? undefined,
    descripcionEstado: x.descripcionEstado ?? null,
  };
};

const statusCountsDefault: Record<DocEstado | 'Todos', number> = {
  Todos: 0,
  Pendiente: 0,
  'En Progreso': 0,
  Rechazado: 0,
  Completado: 0,
};

export default function SupervisionPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocEstado | 'Todos'>('Todos');
  const { toast } = useToast();
  const { page, limit, sort, setPage, setLimit, toggleSort } = usePaginationState({
    defaultLimit: 10,
    defaultSort: 'desc',
  });
  const sortOrder: 'asc' | 'desc' = sort;

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      if (page !== 1) setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchInput, setPage]);

  const documentsQuery = useQuery({
    queryKey: [
      'documents',
      'supervision',
      'table',
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
      };
      if (search) params.search = search;
      if (statusFilter !== 'Todos') params.estado = statusFilter;
      const response = await getDocumentSupervision(params);
      return {
        ...response,
        items: response.items.map(toSupervisionDoc),
      };
    },
    keepPreviousData: true,
    retry: false,
  });

  useEffect(() => {
    if (!documentsQuery.error) return;
    toast({
      variant: 'destructive',
      title: 'Error al cargar datos',
      description: 'No se pudieron obtener los datos para la supervisión.',
    });
  }, [documentsQuery.error, toast]);

  const countsQuery = useQuery({
    queryKey: ['documents', 'supervision', 'counts', { search }],
    queryFn: async () => getSupervisionStats({ search }),
    retry: false,
  });

  const counts = useMemo(() => {
    const resumen = countsQuery.data;
    if (!resumen) return statusCountsDefault;
    return {
      Todos: resumen.Todos ?? 0,
      Pendiente: resumen.Pendiente ?? 0,
      'En Progreso': resumen['En Progreso'] ?? 0,
      Rechazado: resumen.Rechazado ?? 0,
      Completado: resumen.Completado ?? 0,
    } as Record<DocEstado | 'Todos', number>;
  }, [countsQuery.data]);

  const isInitialLoading = documentsQuery.isPending && !documentsQuery.data;

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
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
      <SupervisionTable
        items={documents}
        title="Supervisión de Documentos"
        description="Monitoree el estado y progreso de todos los documentos en tiempo real."
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
    </div>
  );
}
