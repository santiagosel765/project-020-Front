"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { usePaginationState } from '@/hooks/usePaginationState';
import type { RoleForm } from '@/components/role-form-modal';

export default function RolesPage() {
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();
  const { page, limit, sort, search, setPage, setLimit, setSearch } = usePaginationState({
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
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, setPage, setSearch]);

  const rolesQuery = useQuery({
    queryKey: ['roles', { page, limit, sort, search, showInactive }],
    queryFn: async () => {
      const params: GetRolesParams = { page, limit, sort, search, showInactive };
      const result = await getRoles(params);
      return result;
    },
    keepPreviousData: true,
    retry: false,
  });

  useEffect(() => {
    if (!rolesQuery.error) return;
    toast({
      variant: 'destructive',
      title: 'Error al cargar roles',
      description: 'No se pudieron obtener los roles.',
    });
  }, [rolesQuery.error, toast]);

  const isInitialLoading = rolesQuery.isPending && !rolesQuery.data;

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
        if (page !== 1) {
          setPage(1);
          return;
        }
      }
      await rolesQuery.refetch();
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
      await rolesQuery.refetch();
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
      await rolesQuery.refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al restaurar',
        description: 'Hubo un problema al restaurar el rol.',
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

  const payload = rolesQuery.data;

  return (
    <div className="h-full">
      <RolesTable
        data={payload}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        showInactive={showInactive}
        onToggleInactive={(checked) => {
          setShowInactive(checked);
          if (page !== 1) setPage(1);
        }}
        onSaveRole={handleSaveRole}
        onDeleteRole={handleDeleteRole}
        onRestoreRole={handleRestoreRole}
        loading={rolesQuery.isFetching}
      />
    </div>
  );
}
