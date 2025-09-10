"use client";

import React, { useMemo, useState } from 'react';
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
import { format } from 'date-fns';

interface RolesTableProps {
  roles: Role[];
  showInactive: boolean;
  onToggleInactive: (checked: boolean) => void;
  onSaveRole: (role: RoleForm) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void> | void;
  onRestoreRole: (id: string) => Promise<void> | void;
}

export function RolesTable({ roles, showInactive, onToggleInactive, onSaveRole, onDeleteRole, onRestoreRole }: RolesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);

  const filteredRoles = useMemo(
    () => roles.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
    [roles, searchTerm]
  );

  const openModal = (role?: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(undefined);
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
              <CardTitle>Gestión de Roles ({roles.length})</CardTitle>
              <CardDescription>Administre los roles de la plataforma.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="relative w-full md:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roles..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="show-inactive" checked={showInactive} onCheckedChange={onToggleInactive} />
                <label htmlFor="show-inactive" className="text-sm whitespace-nowrap">Ver inactivos</label>
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
              {filteredRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell">{role.descripcion}</TableCell>
                  <TableCell>
                    <Badge variant={role.activo ? 'default' : 'secondary'}>
                      {role.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {role.createdAt ? format(new Date(role.createdAt), 'dd/MM/yyyy') : ''}
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
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDeleteRole(role.id!)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onRestoreRole(role.id!)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            <span>Restaurar</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
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

