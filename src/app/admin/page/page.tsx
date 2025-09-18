"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { useServerPagination } from '@/hooks/useServerPagination';

export default function PageAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { page, limit, setPage, setLimit, setFromMeta } = useServerPagination();

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetPagesParams = { page, limit, search, showInactive };
      const { items, meta } = await getPages(params);
      setTotal(meta.total ?? 0);
      if (meta.pages > 0 && page > meta.pages) {
        setFromMeta(meta);
        return;
      }
      setPages(items);
      setFromMeta(meta);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar páginas',
        description: 'No se pudieron obtener las páginas.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, setFromMeta, showInactive, toast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleSavePage = async (pageData: Partial<Page>) => {
    try {
      if (pageData.id) {
        await updatePage(pageData.id, pageData);
        toast({ title: 'Página actualizada', description: 'La página ha sido actualizada.' });
      } else {
        await createPage(pageData as any);
        toast({ title: 'Página creada', description: 'La nueva página ha sido agregada.' });
        setPage(1);
      }
      await fetchPages();
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
      await fetchPages();
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
      await fetchPages();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al restaurar',
        description: 'Hubo un problema al restaurar la página.',
      });
    }
  };

  if (isLoading) {
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

  return (
    <div className="h-full">
      <PagesTable
        pages={pages}
        total={total}
        page={page}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        showInactive={showInactive}
        onToggleInactive={(checked) => {
          setShowInactive(checked);
          setPage(1);
        }}
        onSavePage={handleSavePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
      />
    </div>
  );
}

