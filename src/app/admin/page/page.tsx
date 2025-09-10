"use client";

import React, { useEffect, useState } from 'react';
import { PagesTable } from '@/components/pages-table';
import { getPages, createPage, updatePage, deletePage, restorePage, type Page } from '@/services/pageService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageAdminPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const data = await getPages(showInactive);
        setPages(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar páginas',
          description: 'No se pudieron obtener las páginas.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPages();
  }, [showInactive, toast]);

  const handleSavePage = async (page: Partial<Page>) => {
    try {
      let saved: Page;
      if (page.id) {
        saved = await updatePage(page.id, page);
        setPages(prev => prev.map(p => p.id === saved.id ? saved : p));
        toast({ title: 'Página actualizada', description: 'La página ha sido actualizada.' });
      } else {
        saved = await createPage(page as any);
        setPages(prev => [...prev, saved]);
        toast({ title: 'Página creada', description: 'La nueva página ha sido agregada.' });
      }
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
      setPages(prev => prev.map(p => p.id === id ? { ...p, activo: false } : p));
      toast({ variant: 'destructive', title: 'Página inactivada', description: 'La página ha sido marcada como inactiva.' });
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
      const restored = await restorePage(id);
      setPages(prev => prev.map(p => p.id === id ? restored : p));
      toast({ title: 'Página restaurada', description: 'La página ha sido activada nuevamente.' });
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
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onSavePage={handleSavePage}
        onDeletePage={handleDeletePage}
        onRestorePage={handleRestorePage}
      />
    </div>
  );
}

