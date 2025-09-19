"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { pageDebug } from '@/lib/page-debug';

export default function PageAdminPage() {
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();
  const { page, limit, sort, search, setPage, setLimit, setSearch, isUserPagingRef } = usePaginationState({
    defaultLimit: 10,
    defaultSort: 'desc',
  });
  const [searchInput, setSearchInput] = useState(() => search);
  const initialSearchRef = useRef(search);
  const isFirstSearchEffect = useRef(true);

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
        pageDebug('src/app/admin/page/page.tsx:47:setPage(skip)', {
          reason: 'userPaging',
          from: page,
          to: 1,
          searchInput,
        });
        return;
      }
      pageDebug('src/app/admin/page/page.tsx:55:setPage', {
        from: page,
        to: 1,
        searchInput,
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setPage, setSearch]);

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
          if (isUserPagingRef.current) {
            pageDebug('src/app/admin/page/page.tsx:97:setPage(skip)', {
              reason: 'userPaging',
              from: page,
              to: 1,
            });
            return;
          }
          pageDebug('src/app/admin/page/page.tsx:104:setPage', {
            from: page,
            to: 1,
          });
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

  return (
    <div className="h-full">
      <PagesTable
        data={payload}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        showInactive={showInactive}
        onToggleInactive={(checked) => {
          setShowInactive(checked);
          if (page !== 1) {
            if (isUserPagingRef.current) {
              pageDebug('src/app/admin/page/page.tsx:181:setPage(skip)', {
                reason: 'userPaging',
                from: page,
                to: 1,
                showInactive: checked,
              });
              return;
            }
            pageDebug('src/app/admin/page/page.tsx:189:setPage', {
              from: page,
              to: 1,
              showInactive: checked,
            });
            setPage(1);
          }
        }}
        onSavePage={handleSavePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
        loading={pagesQuery.isFetching}
      />
    </div>
  );
}
