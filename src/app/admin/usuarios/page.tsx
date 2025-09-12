
"use client";

import React, { useState, useEffect } from 'react';
import { UsersTable } from "@/components/users-table";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getUsers, createUser, updateUser, deleteUser } from '@/services/usersService';
import type { User } from '@/lib/data';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getFullName = (u: User) =>
    [
      u.primerNombre,
      u.segundoNombre,
      u.tercerNombre,
      u.primerApellido,
      u.segundoApellido,
      u.apellidoCasada,
    ]
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers((data as unknown as User[]).sort((a, b) => getFullName(a).localeCompare(getFullName(b))));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar usuarios',
          description: 'No se pudieron obtener los datos de los usuarios.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const handleSaveUser = async (user: User) => {
    try {
      let saved: User;
      if (!user.id) {
        saved = await createUser(user as any);
        setUsers(prev => [...prev, saved].sort((a, b) => getFullName(a).localeCompare(getFullName(b))));
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' });
      } else {
        saved = await updateUser(user.id!, user as any);
        setUsers(prev => prev.map(u => u.id === saved.id ? saved : u).sort((a, b) => getFullName(a).localeCompare(getFullName(b))));
        toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Hubo un problema al guardar los datos del usuario.',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(Number(userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ variant: 'destructive', title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'Hubo un problema al eliminar el usuario.',
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
        <UsersTable 
          users={users} 
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
        />
    </div>
  );
}
