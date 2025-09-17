'use client';

import React, { useState, useEffect } from 'react';
import { UsersTable } from '@/components/users-table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getUsers, createUser, updateUser, deleteUser, buildUserFormData } from '@/services/usersService';
import type { User } from '@/lib/data';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fullName = (u: User) =>
    [u.primerNombre, u.segundoNombre, u.tercerNombre, u.primerApellido, u.segundoApellido, u.apellidoCasada]
      .filter(Boolean)
      .join(' ');

  useEffect(() => {
    (async () => {
      try {
        const list = await getUsers();
        const arr = Array.isArray(list) ? list : [];
        setUsers(arr.sort((a, b) => fullName(a).localeCompare(fullName(b))));
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error al cargar usuarios',
          description: 'No se pudieron obtener los datos de los usuarios.',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  const handleSaveUser = async ({ data, file }: { data: User; file?: File | null }) => {
    try {
      const formData = buildUserFormData(data, file ?? null);
      if (!data.id) {
        const created = await createUser(formData);
        setUsers((prev) => [...prev, created].sort((a, b) => fullName(a).localeCompare(fullName(b))));
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' });
      } else {
        const updated = await updateUser(Number(data.id), formData);
        setUsers((prev) =>
          prev
            .map((u) => (String(u.id) === String(updated.id) ? updated : u))
            .sort((a, b) => fullName(a).localeCompare(fullName(b))),
        );
        toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el usuario.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(Number(userId));
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)));
      toast({ variant: 'destructive', title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo eliminar el usuario.' });
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

  return <UsersTable users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />;
}

