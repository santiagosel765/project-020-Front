"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PagesTable } from '@/components/pages-table';
import {
  getPages,
  createPage,
  updatePage,
  deletePage,
  restorePage,
  type Page,
  type GetPagesParams,
} from '@/services/pageService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaginationState } from '@/hooks/usePaginationState';

export default function PageAdminPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { page, limit, sort, setPage, setLimit } = usePaginationState({
    defaultLimit: 10,
    defaultSort: 'desc',
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      if (page !== 1) setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [page, searchInput, setPage]);

  const pagesQuery = useQuery({
    queryKey: ['pages', { page, limit, sort, search, showInactive }],
    queryFn: async () => {
      const params: GetPagesParams = { page, limit, sort, search, showInactive };
      const result = await getPages(params);
      return result;
    },
    keepPreviousData: true,
    retry: false,
  });

  useEffect(() => {
    if (!pagesQuery.error) return;
    toast({
      variant: 'destructive',
      title: 'Error al cargar páginas',
      description: 'No se pudieron obtener las páginas.',
    });
  }, [pagesQuery.error, toast]);

  const isInitialLoading = pagesQuery.isPending && !pagesQuery.data;

  const handleSavePage = async (pageData: Partial<Page>) => {
    try {
      if (pageData.id) {
        await updatePage(pageData.id, pageData);
        toast({ title: 'Página actualizada', description: 'La página ha sido actualizada.' });
      } else {
        await createPage(pageData as any);
        toast({ title: 'Página creada', description: 'La nueva página ha sido agregada.' });
        if (page !== 1) {
          setPage(1);
          return;
        }
      }
      await pagesQuery.refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Hubo un problema al guardar la página.',
      });
      throw error;
    }
  };

  const handleDeletePage = async (id: number) => {
    try {
      await deletePage(id);
      toast({ variant: 'destructive', title: 'Página inactivada', description: 'La página ha sido marcada como inactiva.' });
      await pagesQuery.refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'Hubo un problema al eliminar la página.',
      });
    }
  };

  const handleRestorePage = async (id: number) => {
    try {
      await restorePage(id);
      toast({ title: 'Página restaurada', description: 'La página ha sido activada nuevamente.' });
      await pagesQuery.refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al restaurar',
        description: 'Hubo un problema al restaurar la página.',
      });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const payload = pagesQuery.data;
  const items = payload?.items ?? [];
  const total = payload?.total ?? 0;
  const totalPages = payload?.pages ?? 1;
  const currentPage = payload?.page ?? page;
  const currentLimit = payload?.limit ?? limit;
  const hasPrev = payload?.hasPrev ?? currentPage > 1;
  const hasNext = payload?.hasNext ?? currentPage < totalPages;

  return (
    <div className="h-full">
      <PagesTable
        items={items}
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
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        showInactive={showInactive}
        onToggleInactive={(checked) => {
          setShowInactive(checked);
          if (page !== 1) setPage(1);
        }}
        onSavePage={handleSavePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
        loading={pagesQuery.isFetching}
      />
    </div>
  );
}
