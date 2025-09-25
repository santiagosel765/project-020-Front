"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Edit, Trash2, Plus, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PageFormModal, PageForm } from './page-form-modal';
import type { Page } from '@/services/pageService';
import { PaginationBar } from './pagination/PaginationBar';
import { DateCell } from '@/components/DateCell';
import type { PageEnvelope } from '@/lib/pagination';
import { CardList } from '@/components/responsive/card-list';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { FiltersBar, FilterChips, type FilterChip } from './filters/filters-bar';
import { FiltersDrawer } from './filters/filters-drawer';
import { cn } from '@/lib/utils';

interface PagesTableProps {
  data?: PageEnvelope<Page>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  includeInactive: boolean;
  onToggleInactive: (checked: boolean) => void;
  onSavePage: (page: PageForm) => Promise<void>;
  onDeletePage: (id: number) => Promise<void> | void;
  onRestorePage: (id: number) => Promise<void> | void;
  loading?: boolean;
}

export function PagesTable({
  data,
  onPageChange,
  onLimitChange,
  searchTerm,
  onSearchChange,
  includeInactive,
  onToggleInactive,
  onSavePage,
  onDeletePage,
  onRestorePage,
  loading = false,
}: PagesTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | undefined>(undefined);
  const isMdUp = useBreakpoint('md');

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasPrev = Boolean(data?.hasPrev);
  const hasNext = Boolean(data?.hasNext);
  const currentLimit = data?.limit ?? 10;

  const openModal = (page?: Page) => {
    setSelectedPage(page);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPage(undefined);
  };

  const handleSave = async (page: PageForm) => {
    await onSavePage(page);
    closeModal();
  };

  const renderFilters = (variant: 'bar' | 'drawer') => {
    const isDrawer = variant === 'drawer';

    return (
      <>
        <div
          className={cn(
            'relative flex-1 min-w-[200px] md:max-w-xs',
            isDrawer && 'w-full',
          )}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar páginas..."
            className={cn('pl-8', isDrawer && 'w-full')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div
          className={cn(
            'flex items-center gap-2',
            isDrawer && 'w-full flex-col items-stretch rounded-lg border p-3',
          )}
        >
          <div className="flex items-center gap-2">
            <Switch id="show-inactive-pages" checked={includeInactive} onCheckedChange={onToggleInactive} />
            <label htmlFor="show-inactive-pages" className="text-sm">
              Mostrar inactivos
            </label>
          </div>
        </div>
      </>
    );
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm.trim()) {
    filterChips.push({
      id: 'search',
      label: `Búsqueda: "${searchTerm}"`,
      onRemove: () => onSearchChange(''),
    });
  }
  if (includeInactive) {
    filterChips.push({
      id: 'inactive',
      label: 'Mostrar inactivos',
      onRemove: () => onToggleInactive(false),
    });
  }

  const toCardItem = (pageItem: Page) => {
    const hasUrl = Boolean(pageItem.url);
    const hasDescription = Boolean(pageItem.descripcion);
    const secondaryContent = hasUrl || hasDescription ? (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {hasUrl ? <span className="truncate">{pageItem.url}</span> : null}
        {hasDescription ? <span className="line-clamp-2">{pageItem.descripcion}</span> : null}
      </div>
    ) : undefined;

    return {
      id: pageItem.id,
      primary: <span className="truncate">{pageItem.nombre}</span>,
      secondary: secondaryContent,
      meta: (
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Badge variant={pageItem.activo ? 'default' : 'secondary'}>
            {pageItem.activo ? 'Activa' : 'Inactiva'}
          </Badge>
          {pageItem.createdAt ? (
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Fecha</span>
              <span className="text-sm text-foreground">
                <DateCell value={pageItem.createdAt} />
              </span>
            </div>
          ) : null}
        </div>
      ),
      actions: (
        <div className="flex flex-col items-end gap-2">
          <Button type="button" size="sm" onClick={() => openModal(pageItem)}>
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Abrir menú">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              collisionPadding={16}
              className="min-w-[12rem] max-w-[calc(100vw-2rem)]"
            >
              <DropdownMenuItem onClick={() => openModal(pageItem)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Editar</span>
              </DropdownMenuItem>
              {pageItem.activo ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDeletePage(pageItem.id!)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onRestorePage(pageItem.id!)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Restaurar</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    };
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Gestión de Páginas ({total})</CardTitle>
                <CardDescription>Administre las páginas de la plataforma.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <FiltersDrawer renderFilters={renderFilters} chips={filterChips} title="Filtros de páginas" />
                <Button onClick={() => openModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Página
                </Button>
              </div>
            </div>
            <FiltersBar renderFilters={renderFilters} chips={filterChips} />
            <FilterChips chips={filterChips} className="md:hidden" />
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          {isMdUp ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((pageItem) => (
                  <TableRow key={pageItem.id}>
                    <TableCell className="font-medium">{pageItem.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{pageItem.url}</TableCell>
                    <TableCell className="hidden md:table-cell">{pageItem.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant={pageItem.activo ? 'default' : 'secondary'}>
                        {pageItem.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <DateCell value={pageItem.createdAt} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          collisionPadding={16}
                          className="min-w-[12rem] max-w-[calc(100vw-2rem)]"
                        >
                          <DropdownMenuItem onClick={() => openModal(pageItem)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          {pageItem.activo ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeletePage(pageItem.id!)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onRestorePage(pageItem.id!)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              <span>Restaurar</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-sm text-muted-foreground">
                      No hay páginas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col gap-4">
              {rows.length > 0 ? (
                <CardList
                  items={rows.map(toCardItem)}
                  primary={(item) => item.primary}
                  secondary={(item) => item.secondary}
                  meta={(item) => item.meta}
                  actions={(item) => item.actions}
                  gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
                />
              ) : (
                !loading && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No hay páginas.</p>
                )
              )}
            </div>
          )}
        </CardContent>
        <PaginationBar
          total={total}
          page={currentPage}
          pages={totalPages}
          limit={currentLimit}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      </Card>
      <PageFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        page={selectedPage}
      />
    </>
  );
}
