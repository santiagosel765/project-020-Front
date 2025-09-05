
"use client";

import React, { useState, useEffect } from 'react';
import { UsersTable } from "@/components/users-table";
import { User } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.sort((a: User, b: User) => a.name.localeCompare(b.name)));
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
    const isNewUser = !user.id;
    const url = isNewUser ? '/api/users' : `/api/users?id=${user.id}`;
    const method = isNewUser ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el usuario');
      }

      const savedUser = await response.json();

      if (isNewUser) {
        setUsers(prev => [...prev, savedUser].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' });
      } else {
        setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u).sort((a, b) => a.name.localeCompare(b.name)));
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
        const response = await fetch(`/api/users?id=${userId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Error al eliminar el usuario');
        }
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
