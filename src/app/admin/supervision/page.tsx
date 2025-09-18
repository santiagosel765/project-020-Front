"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SupervisionTable } from "@/components/supervision-table";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getDocumentSupervision,
  getSupervisionStats,
  type DocumentoRow,
  type SupervisionDoc,
  type DocEstado,
} from '@/services/documentsService';
import { useServerPagination } from '@/hooks/useServerPagination';

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
  const [documents, setDocuments] = useState<SupervisionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocEstado | 'Todos'>('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [counts, setCounts] = useState(statusCountsDefault);
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
      if (statusFilter !== 'Todos') params.estado = statusFilter;
      const { items, meta } = await getDocumentSupervision(params);
      setTotal(meta.total ?? 0);
      if (meta.pages > 0 && page > meta.pages) {
        setFromMeta(meta);
        return;
      }
      setDocuments(items.map(toSupervisionDoc));
      setFromMeta(meta);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar datos',
        description: 'No se pudieron obtener los datos para la supervisión.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, statusFilter, sortOrder, setFromMeta, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const resumen = await getSupervisionStats({ search });
        setCounts({
          Todos: resumen.Todos ?? 0,
          Pendiente: resumen.Pendiente ?? 0,
          'En Progreso': resumen['En Progreso'] ?? 0,
          Rechazado: resumen.Rechazado ?? 0,
          Completado: resumen.Completado ?? 0,
        });
      } catch {
        setCounts(statusCountsDefault);
      }
    };
    loadCounts();
  }, [search]);

  if (isLoading) {
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

  return (
    <div className="h-full">
      <SupervisionTable
        documents={documents}
        title="Supervisión de Documentos"
        description="Monitoree el estado y progreso de todos los documentos en tiempo real."
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(order) => {
          setSortOrder(order);
          setPage(1);
        }}
        statusCounts={counts}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
      />
    </div>
  );
}

