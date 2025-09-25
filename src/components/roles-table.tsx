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

  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Gestión de Roles ({total})</CardTitle>
              <CardDescription>Administre los roles de la plataforma.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative w-full md:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roles..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="show-inactive" checked={includeInactive} onCheckedChange={onToggleInactive} />
                <label htmlFor="show-inactive" className="text-sm whitespace-nowrap">Mostrar inactivos</label>
              </div>
              <Button onClick={() => openModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Rol
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
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
              {roles.map(role => (
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
                      <DropdownMenuContent align="end">
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
