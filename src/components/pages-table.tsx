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

interface PagesTableProps {
  items: Page[];
  total: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showInactive: boolean;
  onToggleInactive: (checked: boolean) => void;
  onSavePage: (page: PageForm) => Promise<void>;
  onDeletePage: (id: number) => Promise<void> | void;
  onRestorePage: (id: number) => Promise<void> | void;
  loading?: boolean;
}

export function PagesTable({
  items,
  total,
  pages,
  hasPrev,
  hasNext,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchTerm,
  onSearchChange,
  showInactive,
  onToggleInactive,
  onSavePage,
  onDeletePage,
  onRestorePage,
  loading = false,
}: PagesTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | undefined>(undefined);

  const rows = Array.isArray(items) ? items : [];

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

  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Gestión de Páginas ({total})</CardTitle>
              <CardDescription>Administre las páginas de la plataforma.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative w-full md:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar páginas..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="show-inactive" checked={showInactive} onCheckedChange={onToggleInactive} />
                <label htmlFor="show-inactive" className="text-sm whitespace-nowrap">Ver inactivos</label>
              </div>
              <Button onClick={() => openModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Página
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
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
            {rows.map(pageItem => (
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openModal(pageItem)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        {pageItem.activo ? (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeletePage(pageItem.id!)}>
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
      </CardContent>
      <PaginationBar
        total={total}
        page={page}
        pages={pages}
        limit={limit}
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
