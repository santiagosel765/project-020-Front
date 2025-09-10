"use client";

import React, { useEffect, useState } from 'react';
import { RolesTable } from '@/components/roles-table';
import { getRoles, createRole, updateRole, deleteRole, restoreRole, type Role } from '@/services/roleService';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const data = await getRoles(showInactive);
        setRoles(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar roles',
          description: 'No se pudieron obtener los roles.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, [showInactive, toast]);

  const handleSaveRole = async (role: Partial<Role>) => {
    try {
      let saved: Role;
      if (role.id) {
        saved = await updateRole(role.id, role);
        setRoles(prev => prev.map(r => r.id === saved.id ? saved : r));
        toast({ title: 'Rol actualizado', description: 'El rol ha sido actualizado.' });
      } else {
        saved = await createRole(role as any);
        setRoles(prev => [...prev, saved]);
        toast({ title: 'Rol creado', description: 'El nuevo rol ha sido agregado.' });
      }
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
      await deleteRole(id);
      setRoles(prev => prev.map(r => r.id === id ? { ...r, activo: false } : r));
      toast({ variant: 'destructive', title: 'Rol inactivado', description: 'El rol ha sido marcado como inactivo.' });
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
      const restored = await restoreRole(id);
      setRoles(prev => prev.map(r => r.id === id ? restored : r));
      toast({ title: 'Rol restaurado', description: 'El rol ha sido activado nuevamente.' });
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
        showInactive={showInactive}
        onToggleInactive={setShowInactive}
        onSaveRole={handleSaveRole}
        onDeleteRole={handleDeleteRole}
        onRestoreRole={handleRestoreRole}
      />
    </div>
  );
}

