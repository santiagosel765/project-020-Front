"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { RolesTable } from '@/components/roles-table';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  restoreRole,
  type Role,
  type GetRolesParams,
} from '@/services/roleService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerPagination } from '@/hooks/useServerPagination';
import type { RoleForm } from '@/components/role-form-modal';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
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

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetRolesParams = { page, limit, search, showInactive };
      const { items, meta } = await getRoles(params);
      setTotal(meta.total ?? 0);
      if (meta.pages > 0 && page > meta.pages) {
        setFromMeta(meta);
        return;
      }
      setRoles(items);
      setFromMeta(meta);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar roles',
        description: 'No se pudieron obtener los roles.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, setFromMeta, showInactive, toast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSaveRole = async (role: RoleForm) => {
    try {
      if (role.id) {
        const roleId = Number(role.id);
        if (!Number.isFinite(roleId)) {
          toast({
            variant: 'destructive',
            title: 'ID de rol inválido',
            description: 'No se pudo determinar el identificador del rol.',
          });
          return;
        }
        await updateRole(roleId, { nombre: role.nombre, descripcion: role.descripcion });
        toast({ title: 'Rol actualizado', description: 'El rol ha sido actualizado.' });
      } else {
        await createRole({ nombre: role.nombre, descripcion: role.descripcion });
        toast({ title: 'Rol creado', description: 'El nuevo rol ha sido agregado.' });
        setPage(1);
      }
      await fetchRoles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Hubo un problema al guardar el rol.',
      });
      throw error;
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const roleId = Number(id);
      if (!Number.isFinite(roleId)) {
        toast({
          variant: 'destructive',
          title: 'ID de rol inválido',
          description: 'No se pudo eliminar el rol porque el identificador no es válido.',
        });
        return;
      }
      await deleteRole(roleId);
      toast({ variant: 'destructive', title: 'Rol inactivado', description: 'El rol ha sido marcado como inactivo.' });
      await fetchRoles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'Hubo un problema al eliminar el rol.',
      });
    }
  };

  const handleRestoreRole = async (id: string) => {
    try {
      const roleId = Number(id);
      if (!Number.isFinite(roleId)) {
        toast({
          variant: 'destructive',
          title: 'ID de rol inválido',
          description: 'No se pudo restaurar el rol porque el identificador no es válido.',
        });
        return;
      }
      await restoreRole(roleId);
      toast({ title: 'Rol restaurado', description: 'El rol ha sido activado nuevamente.' });
      await fetchRoles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al restaurar',
        description: 'Hubo un problema al restaurar el rol.',
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
      <RolesTable
        roles={roles}
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
        onSaveRole={handleSaveRole}
        onDeleteRole={handleDeleteRole}
        onRestoreRole={handleRestoreRole}
      />
    </div>
  );
}

