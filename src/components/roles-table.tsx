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
import { RoleFormModal, RoleForm } from './role-form-modal';
import type { Role } from '@/services/roleService';
import { PaginationBar } from './pagination/PaginationBar';
import { DateCell } from '@/components/DateCell';
import type { PageEnvelope } from '@/lib/pagination';
import { CardList } from '@/components/responsive/card-list';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { FiltersBar, FilterChips, type FilterChip } from './filters/filters-bar';
import { FiltersDrawer } from './filters/filters-drawer';
import { cn } from '@/lib/utils';

interface RolesTableProps {
  data?: PageEnvelope<Role>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  includeInactive: boolean;
  onToggleInactive: (checked: boolean) => void;
  onSaveRole: (role: RoleForm) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void> | void;
  onRestoreRole: (id: string) => Promise<void> | void;
  loading?: boolean;
}

export function RolesTable({
  data,
  onPageChange,
  onLimitChange,
  searchTerm,
  onSearchChange,
  includeInactive,
  onToggleInactive,
  onSaveRole,
  onDeleteRole,
  onRestoreRole,
  loading = false,
}: RolesTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const isMdUp = useBreakpoint('md');

  const roles = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasPrev = Boolean(data?.hasPrev);
  const hasNext = Boolean(data?.hasNext);
  const currentLimit = data?.limit ?? 10;

  const openModal = (role?: Role) => {
    setSelectedRole(role ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
  };

  const handleSave = async (role: RoleForm) => {
    await onSaveRole(role);
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
            placeholder="Buscar roles..."
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
            <Switch id="show-inactive" checked={includeInactive} onCheckedChange={onToggleInactive} />
            <label htmlFor="show-inactive" className="text-sm">
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

  const toCardItem = (role: Role) => ({
    id: role.id,
    primary: <span className="truncate">{role.nombre}</span>,
    secondary: role.descripcion ? (
      <span className="line-clamp-2 text-muted-foreground">{role.descripcion}</span>
    ) : undefined,
    meta: (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        <Badge variant={role.activo ? 'default' : 'secondary'}>
          {role.activo ? 'Activa' : 'Inactiva'}
        </Badge>
        {role.createdAt ? (
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Fecha</span>
            <span className="text-sm text-foreground">
              <DateCell value={role.createdAt} />
            </span>
          </div>
        ) : null}
      </div>
    ),
    actions: (
      <div className="flex flex-col items-end gap-2">
        <Button type="button" size="sm" onClick={() => openModal(role)}>
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
            <DropdownMenuItem onClick={() => openModal(role)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </DropdownMenuItem>
            {role.activo ? (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteRole(String(role.id ?? ''))}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onRestoreRole(String(role.id ?? ''))}>
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>Restaurar</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  });

  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Gestión de Roles ({total})</CardTitle>
                <CardDescription>Administre los roles de la plataforma.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <FiltersDrawer renderFilters={renderFilters} chips={filterChips} title="Filtros de roles" />
                <Button onClick={() => openModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Rol
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
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.nombre}</TableCell>
                    <TableCell className="hidden md:table-cell">{role.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant={role.activo ? 'default' : 'secondary'}>
                        {role.activo ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <DateCell value={role.createdAt} />
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
                          <DropdownMenuItem onClick={() => openModal(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          {role.activo ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteRole(String(role.id ?? ''))}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onRestoreRole(String(role.id ?? ''))}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              <span>Restaurar</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && roles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                      No hay roles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col gap-4">
              {roles.length > 0 ? (
                <CardList
                  items={roles.map(toCardItem)}
                  primary={(item) => item.primary}
                  secondary={(item) => item.secondary}
                  meta={(item) => item.meta}
                  actions={(item) => item.actions}
                  gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
                />
              ) : (
                !loading && (
                  <p className="py-6 text-center text-sm text-muted-foreground">No hay roles.</p>
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
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        role={selectedRole}
      />
    </>
  );
}
